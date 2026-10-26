#!/usr/bin/env node
// Real coastline outlines as SVG path data, for maps that draw themselves.
//
//   mkdir -p /tmp/geo && (cd /tmp/geo && npm init -y >/dev/null && npm i world-atlas@2.0.2 topojson-client@3.1.0)
//   node geo-outline.mjs --deps /tmp/geo --countries 826,372 --bounds -10.8,2.0,49.8,59.0 --pin -1.39,51.03 --w 900 --h 1080 --out uk.json
//
// --countries: ISO 3166-1 numeric ids (826 UK, 372 Ireland, 250 France, 276 Germany, 840 USA …) or "all" (Antarctica excluded)
// --bounds:    lonMin,lonMax,latMin,latMax of the frame
// --pin:       lon,lat of the place to mark (projected into the same space)
// --pins:      several places, "lon,lat;lon,lat;…" → output pins: [[x, y], …] in the same order
// --res:       50m (default, country detail) or 110m (whole-world maps — far lighter)
// --thin:      drop points closer than this many output pixels to the previous kept point (default 0.8; 2 for world maps)
// Output JSON: { w, h, pin: [x, y], paths: [{ id, len, d }] } — `len` is the projected perimeter (handy for dash timing).
// Projection: equirectangular with x scaled by cos(mid-latitude) — right for a country-scale poster map.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const a = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, all) => (v.startsWith("--") ? [...acc, [v.slice(2), all[i + 1]]] : acc), []));
const deps = a.deps || "/tmp/geo";
const require = createRequire(join(deps, "package.json"));
const { feature } = require("topojson-client");
const topo = JSON.parse(readFileSync(join(deps, `node_modules/world-atlas/countries-${a.res || "50m"}.json`), "utf8"));
const thin = Number(a.thin ?? 0.8);
const fc = feature(topo, topo.objects.countries);
const ids = a.countries === "all" ? fc.features.map((f) => f.id).filter((id) => id && id !== "010") : String(a.countries || "826").split(",");
const [lon0, lon1, lat0, lat1] = String(a.bounds || "-10.8,2.0,49.8,59.0").split(",").map(Number);
const W = Number(a.w || 900);
const H = Number(a.h || 1080);
const pad = 20;
const k = Math.cos((((lat0 + lat1) / 2) * Math.PI) / 180);
const s = Math.min((W - 2 * pad) / ((lon1 - lon0) * k), (H - 2 * pad) / (lat1 - lat0));
const P = ([lo, la]) => [pad + (lo - lon0) * k * s, pad + (lat1 - la) * s];
// Date line: some datasets keep rings that cross ±180° (Russia, Fiji, the Aleutians). Unwrap each ring so consecutive
// points never jump more than 180°, then move a ring that lies wholly outside the frame by ±360°. Point-by-point
// shifting would split rings and draw stray lines across the map.
const unwrap = (ring) => {
  const out = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    let lo = ring[i][0];
    const prev = out[i - 1][0];
    while (lo - prev > 180) lo -= 360;
    while (lo - prev < -180) lo += 360;
    out.push([lo, ring[i][1]]);
  }
  return out;
};
const wrapRing = (ring) => {
  const r = unwrap(ring);
  const los = r.map(([lo]) => lo);
  if (Math.max(...los) < lon0) return r.map(([lo, la]) => [lo + 360, la]);
  if (Math.min(...los) > lon1) return r.map(([lo, la]) => [lo - 360, la]);
  return r;
};

const paths = [];
for (const id of ids) {
  const f = fc.features.find((x) => x.id === id);
  if (!f) { console.warn(`no country ${id}`); continue; }
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    const ring = wrapRing(poly[0]).map(P).filter((p, i, arr) => {
      if (i === 0 || i === arr.length - 1) return true;
      const q = arr[i - 1];
      return Math.hypot(p[0] - q[0], p[1] - q[1]) >= thin;
    });
    let len = 0;
    for (let i = 1; i < ring.length; i++) len += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
    if (len < 40) continue; // drop specks
    paths.push({ id, len: Math.round(len), d: "M" + ring.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z" });
  }
}
const pin = a.pin ? P(String(a.pin).split(",").map(Number)) : null;
const pins = a.pins ? String(a.pins).split(";").map((p) => P(p.split(",").map(Number)).map((v) => Math.round(v * 10) / 10)) : undefined;
writeFileSync(a.out || "map.json", JSON.stringify({ w: W, h: H, pin, pins, paths }));
console.log(`${paths.length} outlines → ${a.out || "map.json"}${pin ? `, pin at ${pin.map((v) => v.toFixed(1)).join(", ")}` : ""}`);
