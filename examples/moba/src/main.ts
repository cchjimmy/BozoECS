/**
 * By Original PNG version by Raizin, SVG rework by Sameboat. - file:Map of MOBA.png (CC 3.0), CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=29443207
 */

import { entityT, World } from "../../../src/index.ts";
import { default as config } from "./config.json" with { type: "json" };

// components
const PIDController = {
  kp: 0,
  ki: 0,
  kd: 0,
  prevErr: 0,
  accumErr: 0,
  result: function (currentErr: number, dt: number): number {
    if (dt == 0) return 0;
    this.accumErr += currentErr;
    const out =
      this.kp * currentErr +
      this.ki * this.accumErr +
      (this.kd * (currentErr - this.prevErr)) / dt;
    this.prevErr = currentErr;
    return out;
  },
  reset: function (): void {
    this.prevErr = this.accumErr = 0;
  },
};
const Stats = {
  healthPoint: 0,
  attackPoint: 0,
  defencePoint: 0,
  abilityPower: 0,
  moveSpeed: 0,
  attackSpeed: 0,
};
const Callback = { callback: new Function() };
const Transform = { x: 0, y: 0, rad: 0, scaleX: 1, scaleY: 1 };
const Velocity = { x: 0, y: 0 };
const PlayerControl = {};
const ComControl = {};
const ParticleEmitter = {
  spread: 0,
  particleEntity: -1,
  particleLifetimeSeconds: 1,
  speed: 1,
  emit: false,
};
const Camera = { zoom: 20, tilt: 0, isActive: false, targetEntity: -1 };
const Rect = { width: 2, height: 2 };
const Graphic = { src: "" };
const Button = { hovered: false, pressed: false, clicked: false };
const Colour = { fill: "white", stroke: "black" };
const Text = {
  content: "",
  fontSize: 20,
  padding: 3,
  color: "black",
  backgroundColor: "white",
};
const Timer = { timeMilli: 0, reset: false, stop: false };
const PathFinder = { targetX: 0, targetY: 0 };

// singletons
const Ctx2D = setUpCanvas2D();
const Pointer = setUpPointer();
const Keys = setUpKeyboard();
const Time = setUpTime();

function setUpCanvas2D(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas =
    document.querySelector("canvas") ?? document.createElement("canvas");
  if (!canvas) throw new Error("Cannot create canvas element.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot initialize context 2d.");

  document.body.appendChild(canvas);

  globalThis.onresize = globalThis.onload = () => {
    if (innerWidth / innerHeight < canvas.width / canvas.height) {
      canvas.style.width = "100%";
      canvas.style.height = "";
    } else {
      canvas.style.width = "";
      canvas.style.height = "100%";
    }
  };

  return { canvas, ctx };
}
function setUpKeyboard(): Record<
  "isDown" | "justPressed" | "justReleased",
  Record<string, boolean>
> {
  const keys: ReturnType<typeof setUpKeyboard> = {
    isDown: {},
    justPressed: {},
    justReleased: {},
  };

  globalThis.onkeydown = (e) => {
    !keys.isDown[e.key] && (keys.justPressed[e.key] = true);
    keys.isDown[e.key] = true;
  };
  globalThis.onkeyup = (e) => {
    keys.isDown[e.key] = false;
    keys.justReleased[e.key] = true;
  };

  return keys;
}
function keyboardUpdate(
  keys: Record<
    "isDown" | "justPressed" | "justReleased",
    Record<string, boolean>
  >,
) {
  for (const key in keys.justPressed) keys.justPressed[key] = false;
  for (const key in keys.justReleased) keys.justReleased[key] = false;
}
function setUpPointer() {
  const pointer = {
    x: 0,
    y: 0,
    isDown: false,
    justPressed: false,
    justReleased: false,
    pressPos: { x: 0, y: 0 },
    releasePos: { x: 0, y: 0 },
  };

  globalThis.onpointerdown = (e) => {
    ((pointer.x = e.x), (pointer.y = e.y));
    Object.assign(pointer.pressPos, pointer);
    pointer.isDown = pointer.justPressed = true;
  };

  globalThis.onpointerup = (e) => {
    ((pointer.x = e.x), (pointer.y = e.y));
    Object.assign(pointer.releasePos, pointer);
    ((pointer.isDown = false), (pointer.justReleased = true));
  };

  globalThis.onpointermove = (e) => {
    ((pointer.x = e.x), (pointer.y = e.y));
  };

  return pointer;
}
function pointerUpdate(
  pointer: Record<"isDown" | "justPressed" | "justReleased", boolean>,
) {
  pointer.justPressed = false;
  pointer.justReleased = false;
}
function setUpTime() {
  return { dtMilli: 0, timeMilli: 0 };
}
function timeUpdate(time: { dtMilli: number; timeMilli: number }) {
  time.dtMilli = performance.now() - time.timeMilli;
  time.timeMilli += time.dtMilli;
}

// systems
function handleParticleEmitters(world: World) {
  world.query({ and: [ParticleEmitter, Transform] }).forEach((e) => {
    const emitter = World.getComponent(e, ParticleEmitter);
    if (!emitter.emit || !World.hasComponent(emitter.particleEntity, Transform))
      return;
    emitter.emit = false;
    const t = World.getComponent(e, Transform);
    const particle = World.copyEntity(emitter.particleEntity);
    const particleTransform = World.getComponent(particle, Transform);
    Object.assign(particleTransform, t);
    world.addEntity(particle);
    const timer = World.addComponent(particle, Timer);
    const rand = Math.random() > 0.5;
    const radian =
      t.rad + Math.random() * emitter.spread * Math.PI * (-1 * +rand + +!rand);
    particleTransform.rad = radian;
    World.addComponent(particle, Velocity, {
      x: Math.cos(radian) * emitter.speed,
      y: Math.sin(radian) * emitter.speed,
    });
    World.addComponent(particle, Callback).callback = () => {
      if (timer.timeMilli < emitter.particleLifetimeSeconds * 1000) return;
      World.deleteEntity(particle);
    };
  });
}
function handleInput(world: World) {
  let camera: typeof Camera | null;
  let camTransform: typeof Transform | null;
  world.query({ and: [Camera, Transform] }).forEach((e) => {
    const c = World.getComponent(e, Camera);
    if (!c.isActive) return;
    camera = c;
    camTransform = World.getComponent(e, Transform);
  });
  const pressPos = pointerToScreen(Pointer.pressPos, Ctx2D.canvas);
  world.query({ and: [PathFinder, PlayerControl] }).forEach((e) => {
    if (!camera || !camTransform) return;
    const pf = World.getComponent(e, PathFinder);
    if (!Pointer.justPressed) return;
    const worldPos = screenToWorld(
      pressPos,
      camTransform,
      camera.tilt,
      camera.zoom,
    );
    pf.targetX = worldPos.x;
    pf.targetY = worldPos.y;
  });
}

function handlePathfind(world: World) {
  world
    .query({ and: [PathFinder, Transform, Velocity, Stats] })
    .forEach((e) => {
      const pf = World.getComponent(e, PathFinder);
      const p = World.getComponent(e, Transform);
      const v = World.getComponent(e, Velocity);
      const s = World.getComponent(e, Stats);

      const dx = pf.targetX - p.x;
      const dy = pf.targetY - p.y;
      const dMag = (dx * dx + dy * dy) ** 0.5;
      if (dMag == 0) return;
      const controlDistance = ((s.moveSpeed * Time.dtMilli) / 1000) * 2;
      const adjustedSpeed =
        dMag > controlDistance
          ? s.moveSpeed
          : (s.moveSpeed * dMag) / controlDistance;
      v.x = (dx / dMag) * adjustedSpeed;
      v.y = (dy / dMag) * adjustedSpeed;
    });
}

function handleTimers(world: World) {
  world.query({ and: [Timer] }).forEach((e) => {
    World.hasComponent(e, Callback) &&
      World.getComponent(e, Callback).callback(e);
    const t = World.getComponent(e, Timer);
    if (t.reset) t.timeMilli = 0;
    t.reset = false;
    if (!t.stop) t.timeMilli += Time.dtMilli;
  });
}

function drawTexts(world: World) {
  world.query({ and: [Text, Transform] }).forEach((e) => {
    const t = World.getComponent(e, Text);
    const p = World.getComponent(e, Transform);
    Ctx2D.ctx.font = `${t.fontSize}px serif`;
    const old = Ctx2D.ctx.fillStyle;
    const lines = t.content.split("\n");
    for (let i = 0, l = lines.length; i < l; i++) {
      const txtMetric = Ctx2D.ctx.measureText(lines[i]);
      Ctx2D.ctx.fillStyle = t.backgroundColor;
      Ctx2D.ctx.fillRect(
        p.x,
        p.y + i * (2 * t.padding) + i * txtMetric.fontBoundingBoxAscent,
        t.padding * 2 + txtMetric.width,
        t.padding * 2 + txtMetric.fontBoundingBoxAscent,
      );
      Ctx2D.ctx.fillStyle = t.color;
      Ctx2D.ctx.fillText(
        lines[i],
        p.x + t.padding,
        p.y + i * (2 * t.padding) + (i + 1) * txtMetric.fontBoundingBoxAscent,
      );
    }
    Ctx2D.ctx.fillStyle = old;
  });
}

function drawRectangle(
  ctx: CanvasRenderingContext2D,
  p: typeof Transform,
  r: typeof Rect,
  c: typeof Colour,
) {
  const oldF = ctx.fillStyle;
  const oldS = ctx.strokeStyle;
  ctx.fillStyle = c.fill;
  ctx.strokeStyle = c.stroke;
  const cos = Math.cos(p.rad);
  const sin = Math.sin(p.rad);
  ctx.transform(cos, sin, -sin, cos, p.x, p.y);
  const rect = new Path2D(
    `M ${-r.width * 0.5 * p.scaleX} ${-r.height * 0.5 * p.scaleY} h ${r.width * p.scaleX} v ${r.height * p.scaleY} h ${-r.width * p.scaleX} Z`,
  );
  ctx.fill(rect);
  ctx.stroke(rect);
  ctx.transform(
    cos,
    -sin,
    sin,
    cos,
    cos * -p.x + sin * -p.y,
    -sin * -p.x + cos * -p.y,
  );
  ctx.fillStyle = oldF;
  ctx.strokeStyle = oldS;
}

function drawRects(world: World) {
  world.query({ and: [Transform, Rect, Colour] }).forEach((e) => {
    const p = World.getComponent(e, Transform);
    const r = World.getComponent(e, Rect);
    const c = World.getComponent(e, Colour);
    drawRectangle(Ctx2D.ctx, p, r, c);
  });
}

function drawPathFindTargets(world: World) {
  const old = Ctx2D.ctx.fillStyle;
  Ctx2D.ctx.fillStyle = "red";
  world.query({ and: [PathFinder] }).forEach((e) => {
    const pf = World.getComponent(e, PathFinder);
    Ctx2D.ctx.fillRect(pf.targetX - 0.5, pf.targetY - 0.5, 1, 1);
  });
  Ctx2D.ctx.fillStyle = old;
}

function drawBg(color: string = "#424242") {
  const old = Ctx2D.ctx.fillStyle;
  Ctx2D.ctx.fillStyle = color;
  Ctx2D.ctx.fillRect(0, 0, Ctx2D.canvas.width, Ctx2D.canvas.height);
  Ctx2D.ctx.fillStyle = old;
}

function handleCamera(world: World) {
  world.query({ and: [Camera, Transform] }).forEach((e) => {
    const c = World.getComponent(e, Camera);
    if (!c.isActive) return;
    resetTransform(Ctx2D.ctx);
    const p = World.getComponent(e, Transform);
    if (c.targetEntity != -1 && World.hasComponent(c.targetEntity, Transform)) {
      const targetPos = World.getComponent(c.targetEntity, Transform);
      Object.assign(p, targetPos);
    }
    const sin = Math.sin(c.tilt) * c.zoom;
    const cos = Math.cos(c.tilt) * c.zoom;
    Ctx2D.ctx.transform(
      cos,
      sin,
      -sin,
      cos,
      cos * -p.x - sin * -p.y + Ctx2D.ctx.canvas.width * 0.5,
      sin * -p.x + cos * -p.y + Ctx2D.ctx.canvas.height * 0.5,
    );
  });
}

function move(world: World) {
  const dt = Time.dtMilli / 1000;
  world.query({ and: [Transform, Velocity] }).forEach((e) => {
    const p = World.getComponent(e, Transform);
    const v = World.getComponent(e, Velocity);
    p.x += v.x * dt;
    p.y += v.y * dt;
  });
}

function drawImg(world: World) {
  world.query({ and: [Graphic, Transform] }).forEach((e) => {
    const g = World.getComponent(e, Graphic);
    const p = World.getComponent(e, Transform);
    const r = World.hasComponent(e, Rect) && World.getComponent(e, Rect);
    const img = new Image();
    img.src = g.src;
    const imgWidth = r ? r.width : img.width;
    const imgHeight = r ? r.height : img.height;
    const scaleX = imgWidth / img.width;
    const scaleY = imgHeight / img.height;
    Ctx2D.ctx.transform(scaleX, 0, 0, scaleY, 0, 0);
    Ctx2D.ctx.drawImage(
      img,
      (p.x - imgWidth / 2) / scaleX,
      (p.y - imgHeight / 2) / scaleY,
    );
    Ctx2D.ctx.transform(1 / scaleX, 0, 0, 1 / scaleY, 0, 0);
  });
}

function handleButtons(world: World) {
  const pressPos = pointerToScreen(Pointer.pressPos, Ctx2D.canvas);
  const releasePos = pointerToScreen(Pointer.releasePos, Ctx2D.canvas);
  world.query({ and: [Button, Transform, Rect, Callback] }).forEach((e) => {
    const p = World.getComponent(e, Transform);
    const b = World.getComponent(e, Button);
    const r = World.getComponent(e, Rect);
    const cb = World.getComponent(e, Callback);
    const pressedWithinButton =
      (pressPos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (pressPos.y - p.y) ** 2 < (r.height / 2) ** 2;
    b.hovered =
      (Pointer.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (Pointer.y - p.y) ** 2 < (r.height / 2) ** 2;
    b.pressed = b.hovered && Pointer.isDown && pressedWithinButton;
    b.clicked =
      Pointer.justReleased &&
      pressedWithinButton &&
      (releasePos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (releasePos.y - p.y) ** 2 < (r.height / 2) ** 2;
    cb.callback(e);
  });
}

// entities
function addGraphic(world: World, src: string, x = 0, y = 0, w = 1, h = 1) {
  const e = world.addEntity();
  World.addComponent(e, Transform, { x, y });
  World.addComponent(e, Graphic, { src });
  World.addComponent(e, Rect, { width: w, height: h });
  return e;
}
function addRect(world: World, x = 0, y = 0, w = 1, h = 1) {
  const e = world.addEntity();
  World.addComponent(e, Transform, { x, y });
  World.addComponent(e, Rect, { width: w, height: h });
  World.addComponent(e, Colour, { fill: "green" });
  return e;
}
function addButton(
  world: World,
  x = 0,
  y = 0,
  w = 10,
  h = 10,
  cb = (_: entityT) => {},
) {
  const e = world.addEntity();
  World.addComponent(e, Transform, { x, y });
  World.addComponent(e, Rect, { width: w, height: h });
  World.addComponent(e, Button);
  World.addComponent(e, Colour);
  World.addComponent(e, Callback, { callback: cb });
  return e;
}
function addTimerWithCallback(world: World, cb: (e: entityT) => void) {
  const e = world.addEntity();
  World.addComponent(e, Timer);
  World.addComponent(e, Callback).callback = cb;
  return e;
}
function addPlayer(world: World, x = 0, y = 0) {
  const player = addRect(world, x, y, 1, 1);
  World.addComponent(player, Velocity);
  World.addComponent(player, Stats, { moveSpeed: config.player.speed });
  World.addComponent(player, PlayerControl);
  World.addComponent(player, PathFinder, { targetX: x, targetY: y });
  return player;
}
function addTurrent(world: World, x: number, y: number) {
  const turrent = addRect(world, x, y, 3, 10);
  World.addComponent(turrent, Stats);
  return turrent;
}
function addCamera(world: World, x: number, y: number) {
  const cam = world.addEntity();
  World.addComponent(cam, Camera, { zoom: 30 });
  World.addComponent(cam, Transform, { x, y });
  return cam;
}

//utils
type vec2 = { x: number; y: number };
function screenToWorld(
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
function worldToScreen(
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
function resetTransform(ctx: CanvasRenderingContext2D) {
  ctx.resetTransform();
}
// credit: https://www.30secondsofcode.org/js/s/detect-device-type/
function detectDeviceType(): string {
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? "Mobile"
    : "Desktop";
}
function pointerToScreen(pointer: vec2, canvas: HTMLCanvasElement): vec2 {
  const out = { x: 0, y: 0 };
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

Ctx2D.canvas.width = config.viewport.width;
Ctx2D.canvas.height = config.viewport.height;
Ctx2D.canvas.style.imageRendering = "pixelated";
Ctx2D.ctx.lineWidth = 0.1;

const game = new World();

const player = addPlayer(game, 0, 0);

const turrent = addTurrent(game, 10, 0);

const map = addGraphic(game, "./assets/Map_of_MOBA.svg", 0, 0, 300, 300);

const cam = addCamera(game, 0, 0);
const camComponent = World.getComponent(cam, Camera);
camComponent.targetEntity = player;
camComponent.isActive = true;
camComponent.zoom = 20;

World.addComponent(player, ParticleEmitter, {
  particleEntity: turrent,
  speed: 20,
  particleLifetimeSeconds: 1,
  spread: 0.2,
});

addTimerWithCallback(game, (e) => {
  const timer = World.getComponent(e, Timer);
  if (timer.timeMilli < 100) return;
  timer.reset = true;
  if (!World.hasComponent(player, ParticleEmitter)) {
    World.deleteEntity(e);
    return;
  }
  World.getComponent(player, ParticleEmitter).emit = true;
});

// addTimerWithCallback(game, (e) => {
//   const timer = World.getComponent(e, Timer);
//   if (timer.timeMilli < 2000) return;
//   World.deleteEntity(player);
//   World.deleteEntity(e);
// });

const inGameUi = new World();

addButton(
  inGameUi,
  config.viewport.width * 0.9,
  config.viewport.height * 0.8,
  config.viewport.height * 0.3,
  config.viewport.height * 0.3,
  (e) => {
    const b = World.getComponent(e, Button);
    b.clicked && console.log("clicked");
  },
);

// minimap
// addGraphic(
//   inGameUi,
//   "./assets/Map_of_MOBA.svg",
//   config.viewport.width * 0.1,
//   config.viewport.height * 0.2,
//   config.viewport.height * 0.3,
//   config.viewport.height * 0.3,
// );

const debugTextEntity = inGameUi.addEntity();
const debugText = World.addComponent(debugTextEntity, Text, {
  content: "test string",
  backgroundColor: "white",
});
World.addComponent(debugTextEntity, Transform);

(function update() {
  World.getComponent(player, Transform).rad += (1 * Time.dtMilli) / 1000;
  debugText.content = `FPS: ${Math.ceil(1000 / Time.dtMilli)}\nEntity count: ${game.entityCount()}\nDevice type: ${detectDeviceType()}`;
  drawBg();
  game.update(
    handleTimers,
    handleCamera,
    handlePathfind,
    handleInput,
    handleParticleEmitters,
    drawImg,
    drawRects,
    drawPathFindTargets,
    move,
  );
  resetTransform(Ctx2D.ctx);
  inGameUi.update(drawImg, drawRects, drawTexts, handleButtons);
  pointerUpdate(Pointer);
  keyboardUpdate(Keys);
  timeUpdate(Time);
  requestAnimationFrame(update);
})();
