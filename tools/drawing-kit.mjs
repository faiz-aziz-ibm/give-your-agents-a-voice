// Drawing kit: build a line illustration as a list of timed paths, then emit SVG that draws itself with CSS.
// Author in the reference photo's pixel space (read coordinates off measure-photo.py crops), then scale the SVG.
//
//   import { Drawing } from "./drawing-kit.mjs";
//   const d = new Drawing();
//   d.rect(66, 110, 534, 208, { w: "major", at: 4, dur: 22 });         // massing first
//   d.line(66, 152, 534, 152, { w: "minor", at: 14 });                  // string course
//   d.window(92, 123, 145, 11, { at: 32 });                             // sash window with glazing bars
//   writeFileSync("house.svg.html", d.svg({ box: [60, 4, 590, 208], scale: 2.1, label: "Line drawing of …" }));
//
// Timing is in film frames (30 fps) so the same data can drive a Remotion film; the SVG converts to ms.
// Line weights are screen px at the intended display scale: major 2.4, mid 1.6, minor 1.0, hair 0.85.
const W = { major: 2.4, mid: 1.6, minor: 1.05, hair: 0.85 };
const MS = 1000 / 30;

export class Drawing {
  constructor() { this.els = []; }
  add(d, { w = "minor", at = 0, dur = 12, fill = false, tint = false, cls = "", style = "" } = {}) {
    this.els.push({ d, w: typeof w === "number" ? w : W[w], at, dur, fill, tint, cls, style });
    return this;
  }
  path(d, o) { return this.add(d, o); }
  line(x1, y1, x2, y2, o) { return this.add(`M${x1} ${y1}L${x2} ${y2}`, o); }
  rect(x1, y1, x2, y2, o) { return this.add(`M${x1} ${y1}H${x2}V${y2}H${x1}Z`, o); }
  roundRect(x1, y1, x2, y2, r, o) {
    return this.add(`M${x1 + r} ${y1}H${x2 - r}A${r} ${r} 0 0 1 ${x2} ${y1 + r}V${y2 - r}A${r} ${r} 0 0 1 ${x2 - r} ${y2}H${x1 + r}A${r} ${r} 0 0 1 ${x1} ${y2 - r}V${y1 + r}A${r} ${r} 0 0 1 ${x1 + r} ${y1}Z`, o);
  }
  circle(cx, cy, r, o) { return this.add(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`, o); }
  /** A filled-later area with no stroke (e.g. brick bays tinted at the end to separate materials). */
  tintArea(x1, y1, x2, y2, at = 0) { return this.add(`M${x1} ${y1}H${x2}V${y2}H${x1}Z`, { w: 0.001, at, dur: 1, tint: true }); }
  /** Georgian sash window centred on cx: frame (mid), then a vertical bar and two horizontal bars (minor). */
  window(cx, y1, y2, width, { at = 0 } = {}) {
    const h = width / 2;
    const s = (y2 - y1) / 3;
    this.rect(cx - h, y1, cx + h, y2, { w: "mid", at, dur: 10, fill: true });
    this.line(cx, y1, cx, y2, { at: at + 5, dur: 7 });
    this.line(cx - h, y1 + s, cx + h, y1 + s, { at: at + 6, dur: 6 });
    return this.line(cx - h, y1 + 2 * s, cx + h, y1 + 2 * s, { at: at + 6, dur: 6 });
  }
  /** Triangular pediment with an inset tympanum line. */
  pediment(l, r, base, apex, { at = 0 } = {}) {
    const c = (l + r) / 2;
    this.add(`M${l} ${base}L${c} ${apex}L${r} ${base}Z`, { w: "major", at, dur: 14 });
    return this.add(`M${l + 8} ${base - 2}L${c} ${apex + 4.5}L${r - 8} ${base - 2}Z`, { at: at + 6, dur: 12 });
  }
  /** Corner stones down a vertical edge, alternating long/short, extending in `dir` (+1 right, −1 left). */
  quoins(x, y1, y2, dir, { at = 0, pitch = 7.2, h = 5.4 } = {}) {
    for (let k = 0, y = y1; y + h <= y2; k++, y += pitch) {
      const x2 = x + dir * (k % 2 ? 5 : 8);
      this.rect(Math.min(x, x2), y, Math.max(x, x2), y + h, { w: "hair", at: at + k * 0.8, dur: 5 });
    }
    return this;
  }
  /** Emit inline SVG. Each path carries --d (delay) and --t (duration) in ms for the CSS draw. */
  /** extra: raw SVG markup appended inside the <svg> (labels, images, SMIL loops). */
  svg({ box, scale = 2, label = "", cls = "drawing draw", extra = "" }) {
    const [x0, y0, x1, y1] = box;
    const body = this.els.map((e) => {
      const names = [e.tint ? "tint" : e.fill ? "f" : "", e.cls].filter(Boolean).join(" ");
      const c = names ? ` class="${names}"` : "";
      const sw = e.tint ? 0 : Math.round((e.w / scale) * 100) / 100;
      return `<path${c} pathLength="1" d="${e.d}" style="--d:${Math.round(e.at * MS)}ms;--t:${Math.round(e.dur * MS)}ms;stroke-width:${sw}${e.style ? ";" + e.style : ""}"/>`;
    });
    return [`<svg class="${cls}" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0 + 1}" role="img" aria-label="${label}">`, ...body, extra, `</svg>`].join("\n");
  }
  /** The raw list, for a Remotion component to animate frame by frame. */
  json() { return this.els; }
}
