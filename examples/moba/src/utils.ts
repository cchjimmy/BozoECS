import App from "./app/app.ts";
import { default as config } from "../src/config.json" with { type: "json" };

export function drawBg(color: string = "#424242") {
  const old = App.ctx.fillStyle;
  App.ctx.fillStyle = color;
  App.ctx.fillRect(0, 0, App.canvas.width, App.canvas.height);
  App.ctx.fillStyle = old;
}
export function rectCircleOverLap(
  rcx: number,
  rcy: number,
  rw: number,
  rh: number,
  ccx: number,
  ccy: number,
  cr: number,
) {
  return (
    (ccx - rcx) ** 2 < (rw / 2 + cr) ** 2 &&
    (ccy - rcy) ** 2 < (rh / 2 + cr) ** 2
  );
}
export function rectsOverlap(
  cx1: number,
  cy1: number,
  w1: number,
  h1: number,
  cx2: number,
  cy2: number,
  w2: number,
  h2: number,
): boolean {
  return (
    (cx1 - cx2) ** 2 < ((w1 + w2) / 2) ** 2 &&
    (cy1 - cy2) ** 2 < ((h1 + h2) / 2) ** 2
  );
}
type vec2 = { x: number; y: number };
export function screenToWorld(
  pointerPos: vec2,
  cameraPos: vec2,
  cameraTilt: number,
  cameraZoom: number,
): vec2 {
  const cos = Math.cos(cameraTilt);
  const sin = Math.sin(cameraTilt);
  const res = { x: 0, y: 0 };
  const x = pointerPos.x - config.viewport.width / 2;
  const y = pointerPos.y - config.viewport.height / 2;
  res.x = cos * x + sin * y;
  res.y = -sin * x + cos * y;
  res.x /= cameraZoom;
  res.y /= cameraZoom;
  res.x += cameraPos.x;
  res.y += cameraPos.y;
  return res;
}
export function worldToScreen(
  pos: vec2,
  cameraPos: vec2,
  cameraTilt: number,
  cameraZoom: number,
): vec2 {
  const c = Math.cos(cameraTilt);
  const s = Math.sin(cameraTilt);
  const res = { x: 0, y: 0 };
  let x = pos.x - cameraPos.x;
  let y = pos.y - cameraPos.y;
  x *= cameraZoom;
  y *= cameraZoom;
  res.x = c * x - s * y;
  res.y = s * x + c * y;
  res.x += config.viewport.width * 0.5;
  res.y += config.viewport.height * 0.5;
  return res;
}
// credit: https://www.30secondsofcode.org/js/s/detect-device-type/
export function detectDeviceType(): string {
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? "Mobile"
    : "Desktop";
}
export function pointerToScreen(
  pointer: vec2,
  canvas: HTMLCanvasElement,
): vec2 {
  const out = pointer;
  const rect = canvas.getBoundingClientRect();
  out.x = pointer.x - rect.left;
  out.y = pointer.y - rect.top;
  if (innerWidth / innerHeight < canvas.width / canvas.height) {
    out.x *= canvas.width / innerWidth;
    out.y *= canvas.width / innerWidth;
  } else {
    out.x *= canvas.height / innerHeight;
    out.y *= canvas.height / innerHeight;
  }
  return out;
}
