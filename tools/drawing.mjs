// Hero drawing: the whole pitch in one line illustration, read left to right —
// THE CALL (a phone on a live call) → THE VOICE (ElevenLabs waves that keep speaking) → THE ACTION
// (a watsonx Orchestrate agent fanning out to the four actions from the film's "Watch it work").
// Built with the drawing kit so every stroke draws itself in order; SMIL keeps the voice and actions alive after.
import { Drawing } from "./drawing-kit.mjs";

const MS = 1000 / 30;
const ms = (f) => Math.round(f * MS);
const f1 = (n) => Math.round(n * 10) / 10;

// a speaking waveform: layered sines under a sin² envelope; snapshots at different phases and loudness
const wave = (x0, x1, y, amp, freq, phase, loud, pts = 56) => {
  let d = "";
  for (let i = 0; i <= pts; i++) {
    const u = i / pts;
    const env = Math.sin(Math.PI * u) ** 2;
    const yy = y + Math.sin(u * Math.PI * 2 * freq + phase) * amp * loud * env;
    d += `${i ? "L" : "M"}${f1(x0 + u * (x1 - x0))} ${f1(yy)}`;
  }
  return d;
};
const LOUD = [1, 0.62, 0.95, 0.4, 0.85, 0.55, 1, 0.7];
const speaking = (x0, x1, y, amp, freq, dir, seconds, startFrame, durFrames, extraStyle = "") => {
  const frames = LOUD.map((l, k) => wave(x0, x1, y, amp, freq, dir * (k / LOUD.length) * Math.PI * 2, l));
  frames.push(frames[0]);
  const first = frames[0];
  return `<path pathLength="1" d="${first}" style="--d:${ms(startFrame)}ms;--t:${ms(durFrames)}ms;stroke-width:1.15${extraStyle}"><animate attributeName="d" begin="3.6s" dur="${seconds}s" repeatCount="indefinite" values="${frames.join(";")}"/></path>`;
};

export default function hero() {
  const d = new Drawing();
  const S = 1.48; // display scale (px per unit) the line weights are authored for

  // ── the call: a phone, mid-conversation ──
  d.roundRect(30, 16, 140, 226, 18, { w: "major", at: 0, dur: 22 });
  d.roundRect(37, 30, 133, 212, 11, { w: "mid", at: 8, dur: 18, fill: true });
  d.line(74, 23, 96, 23, { w: "mid", at: 14, dur: 6 });
  d.circle(85, 66, 15, { w: "mid", at: 18, dur: 10 });
  d.line(79, 63, 79, 69, { w: "mid", at: 24, dur: 4 });
  d.line(85, 59, 85, 73, { w: "mid", at: 25, dur: 4 });
  d.line(91, 62, 91, 70, { w: "mid", at: 26, dur: 4 });
  [61, 85, 109].forEach((x, i) => d.circle(x, 188, 8, { w: "minor", at: 30 + i * 2, dur: 8 }));

  // ── the action: the watsonx Orchestrate agent and what it does ──
  d.circle(372, 121, 38, { w: "major", at: 44, dur: 16 });
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
    return [f1(372 + Math.cos(a) * 22), f1(121 + Math.sin(a) * 22)];
  });
  d.path(`M${hex.map((p) => p.join(" ")).join("L")}Z`, { w: "minor", at: 52, dur: 12, style: "stroke-opacity:.55" });
  d.path(hex.map((p) => `M372 121L${p[0]} ${p[1]}`).join(""), { w: "minor", at: 56, dur: 10 });
  hex.forEach((p, i) => d.circle(p[0], p[1], 3.4, { w: "minor", at: 58 + i * 0.8, dur: 6, cls: "white" }));
  const ACTIONS = ["Verify caller", "Find order #4821", "Issue refund · £48.00", "Text confirmation"];
  const CY = [49, 97, 145, 193];
  CY.forEach((cy, k) => {
    d.path(`M410 121C431 121 431 ${cy} 452 ${cy}`, { w: "mid", at: 62 + k * 2, dur: 12, style: "stroke-opacity:.6" });
    d.roundRect(452, cy - 15, 596, cy + 15, 8, { w: "mid", at: 66 + k * 3, dur: 12, fill: true });
    d.circle(467, cy, 6.5, { w: "minor", at: 72 + k * 3, dur: 6 });
    d.path(`M463.6 ${cy}L466.2 ${cy + 2.6}L470.4 ${cy - 2.6}`, { w: 2.1, at: 86 + k * 6, dur: 6 });
  });

  // ── extras: the voice, labels, logos and the loops that keep it alive ──
  const extra = [
    // the voice: three layered waves between the phone and the agent, and a small one on the phone's screen
    speaking(150, 330, 121, 30, 2.2, 1, 2.6, 30, 24),
    speaking(150, 330, 121, 20, 3.1, -1, 3.3, 33, 24, ";stroke-opacity:.5"),
    speaking(150, 330, 121, 13, 1.6, 1, 4.1, 36, 24, ";stroke-opacity:.25"),
    speaking(48, 122, 145, 10, 2.6, 1, 1.9, 26, 16),
    `<image class="lbl" href="assets/elevenlabs-black.png" x="202" y="52" width="76" height="9.8" style="--d:${ms(56)}ms"/>`,
    `<text class="lbl t-mute" x="240" y="-2" text-anchor="middle" style="--d:${ms(52)}ms">THE VOICE</text>`,
    // the phone's screen
    `<text class="lbl t-ink" x="85" y="98" text-anchor="middle" font-size="9.5" style="--d:${ms(28)}ms">AI agent</text>`,
    `<text class="lbl t-mute" x="85" y="110" text-anchor="middle" font-size="7.5" style="--d:${ms(30)}ms">01:52</text>`,
    `<circle class="lbl dotfill" cx="85" cy="188" r="4" style="--d:${ms(36)}ms"/>`,
    `<text class="lbl t-mute" x="85" y="-2" text-anchor="middle" style="--d:${ms(40)}ms">THE CALL</text>`,
    // the agent
    `<circle class="ripple" cx="372" cy="121" r="7"/>`,
    `<circle class="core" cx="372" cy="121" r="7" style="--d:${ms(64)}ms"/>`,
    `<image class="lbl" href="assets/wxo.png" x="316" y="171" width="13" height="13" style="--d:${ms(70)}ms"/>`,
    `<text class="lbl t-ink" x="333" y="181" font-size="10" style="--d:${ms(70)}ms">watsonx Orchestrate</text>`,
    `<text class="lbl t-mute" x="372" y="-2" text-anchor="middle" style="--d:${ms(66)}ms">THE ACTION</text>`,
    ...ACTIONS.map((t, k) => `<text class="lbl t-ink" x="480" y="${CY[k] + 3.6}" font-size="10.5" style="--d:${ms(70 + k * 3)}ms">${t}</text>`),
    // actions flowing out of the agent, forever
    ...CY.flatMap((cy, k) =>
      [0, 1].map((n) => `<circle class="flow" r="2.3"><animateMotion begin="${(4 + k * 0.3 + n * 0.75).toFixed(2)}s" dur="1.5s" repeatCount="indefinite" path="M410 121C431 121 431 ${cy} 452 ${cy}"/></circle>`),
    ),
  ].join("\n");

  return d.svg({ box: [0, -14, 600, 228], scale: S, label: "Line illustration: a phone on a call, ElevenLabs voice waves, and a watsonx Orchestrate agent taking four actions", cls: "drawing hero-art draw", extra });
}
