// Full-page screenshots via the DevTools protocol: node tools/shoot.mjs <url> <out.png> <width> <height> [scrollSteps]
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const [url, out, W = "1440", H = "900", mode = "full"] = process.argv.slice(2); // mode "viewport" captures only the first screen (og images)
const HS = process.env.HS || `${process.env.HOME}/Library/Caches/remotion-hs/chrome-headless-shell-mac-arm64/chrome-headless-shell`; // or any Chrome / headless shell binary
const chrome = spawn(HS, ["--headless", "--disable-gpu", "--hide-scrollbars", "--remote-debugging-port=9333", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 40; i++) {
  try { const t = await (await fetch("http://127.0.0.1:9333/json")).json(); ws = t.find((x) => x.type === "page").webSocketDebuggerUrl; break; } catch { await sleep(250); }
}
const sock = new WebSocket(ws);
await new Promise((r) => (sock.onopen = r));
let id = 0; const wait = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d.result); wait.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 700 });
await send("Page.enable");
await send("Page.navigate", { url });
await sleep(2500);
let total = +H;
if (mode === "viewport") {
  // the first screen only (og images): no scrolling, just let the hero finish drawing
  await sleep(5000);
} else {
  // scroll through the page so every reveal fires, then back to the top
  ({ result: { value: total } } = await send("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true }));
  for (let y = 0; y < total; y += +H * 0.6) { await send("Runtime.evaluate", { expression: `scrollTo(0, ${y})` }); await sleep(260); }
  await sleep(3500);
  await send("Runtime.evaluate", { expression: "document.documentElement.style.scrollBehavior='auto'; scrollTo(0,0)" });
  await sleep(600);
}
const shot = await send("Page.captureScreenshot", mode === "viewport" ? { format: "png" } : { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: +W, height: total, scale: 1 } });
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log("height", total);
sock.close(); chrome.kill();
