// Builds index.html from tools/template.html: inlines the hero drawing (tools/drawing.mjs), the world map with its
// greeting pins (tools/world.json, from geo-outline.mjs) and the "Get in touch" link (tools/config.json → cta).
// Run: node tools/build.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const config = existsSync(join(here, "config.json")) ? JSON.parse(readFileSync(join(here, "config.json"), "utf8")) : {};
const cta = config.cta || "#top";

const hero = (await import(pathToFileURL(join(here, "drawing.mjs")).href)).default();

// the world sweeps in from west to east; each greeting's pin drops in turn
const w = JSON.parse(readFileSync(join(here, "world.json"), "utf8"));
const firstX = (d) => Number(d.slice(1).split(" ")[0]);
const world = [
  `<svg class="world draw" viewBox="0 0 ${w.w} ${w.h}" role="img" aria-label="World map with greetings in Australia, Mexico, the Arab world and Japan">`,
  ...w.paths.map((p) => `<path pathLength="1" d="${p.d}" style="--d:${Math.round((firstX(p.d) / w.w) * 900)}ms;--t:1400ms"/>`),
  ...w.pins.map(([x, y], k) => {
    const pd = `${(1.5 + k * 0.45).toFixed(2)}s`;
    return `<circle class="rip" cx="${x}" cy="${y}" r="7" style="--pd:${pd}"/><circle class="dot" data-pin="${k}" cx="${x}" cy="${y}" r="7" style="--pd:${pd}"/>`;
  }),
  `</svg>`,
].join("\n");

const html = readFileSync(join(here, "template.html"), "utf8").replace("<!--HERO-->", hero).replace("<!--WORLD-->", world).replaceAll("{{CTA}}", cta);
writeFileSync(join(root, "index.html"), html);
console.log(`index.html written (${Math.round(html.length / 1024)} KB) · Get in touch → ${cta}`);
