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
const Pointer = {
  x: 0,
  y: 0,
  isDown: false,
  pressPos: { x: 0, y: 0 },
  justPressed: false,
  justReleased: false,
  releasePos: { x: 0, y: 0 },
};
const Keys: Record<KeyboardEvent["key"], boolean> = {};

// systems
function handleInput(world: World) {
  let camera: typeof Camera | null;
  let camTransform: typeof Transform | null;
  world.query({ and: [Camera, Transform] }).forEach((e) => {
    const c = World.getComponent(e, Camera);
    if (!c.isActive) return;
    camera = c;
    camTransform = World.getComponent(e, Transform);
  });
  world.query({ and: [PathFinder, PlayerControl] }).forEach((e) => {
    if (!camera || !camTransform) return;
    const pf = World.getComponent(e, PathFinder);
    if (!Pointer.justPressed) return;
    const worldPos = screenToWorld(
      Pointer.pressPos,
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
      const controlDistance = ((s.moveSpeed * world.dtMilli) / 1000) * 2;
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
    if (!t.stop) t.timeMilli += world.dtMilli;
  });
}

function drawTexts(world: World) {
  if (!ctx) return;
  world.query({ and: [Text, Transform] }).forEach((e) => {
    const t = World.getComponent(e, Text);
    const p = World.getComponent(e, Transform);
    ctx.font = `${t.fontSize}px serif`;
    const old = ctx.fillStyle;
    const lines = t.content.split("\n");
    for (let i = 0, l = lines.length; i < l; i++) {
      const txtMetric = ctx.measureText(lines[i]);
      ctx.fillStyle = t.backgroundColor;
      ctx.fillRect(
        p.x,
        p.y + i * (2 * t.padding) + i * txtMetric.fontBoundingBoxAscent,
        t.padding * 2 + txtMetric.width,
        t.padding * 2 + txtMetric.fontBoundingBoxAscent,
      );
      ctx.fillStyle = t.color;
      ctx.fillText(
        lines[i],
        p.x + t.padding,
        p.y + i * (2 * t.padding) + (i + 1) * txtMetric.fontBoundingBoxAscent,
      );
    }
    ctx.fillStyle = old;
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
  const rect = new Path2D(
    `M ${p.x - r.width * 0.5 * p.scaleX} ${
      p.y - r.height * 0.5 * p.scaleY
    } h ${r.width * p.scaleX} v ${r.height * p.scaleY} h ${-r.width * p.scaleX} Z`,
  );
  ctx.fill(rect);
  ctx.stroke(rect);
  ctx.fillStyle = oldF;
  ctx.strokeStyle = oldS;
}

function drawRects(world: World) {
  if (!ctx) return;
  world.query({ and: [Transform, Rect, Colour] }).forEach((e) => {
    const p = World.getComponent(e, Transform);
    const r = World.getComponent(e, Rect);
    const c = World.getComponent(e, Colour);
    drawRectangle(ctx, p, r, c);
  });
}

function drawPathFindTargets(world: World) {
  if (!ctx) return;
  const old = ctx.fillStyle;
  ctx.fillStyle = "red";
  world.query({ and: [PathFinder] }).forEach((e) => {
    const pf = World.getComponent(e, PathFinder);
    ctx.fillRect(pf.targetX - 0.5, pf.targetY - 0.5, 1, 1);
  });
  ctx.fillStyle = old;
}

function drawBg(color: string = "#424242") {
  if (!ctx) return;
  const old = ctx.fillStyle;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = old;
}

function handleCamera(world: World) {
  if (!ctx) return;
  world.query({ and: [Camera, Transform] }).forEach((e) => {
    const c = World.getComponent(e, Camera);
    if (!c.isActive) return;
    resetTransform(ctx);
    const p = World.getComponent(e, Transform);
    if (c.targetEntity != -1) {
      const targetPos = World.getComponent(c.targetEntity, Transform);
      Object.assign(p, targetPos);
    }
    const sin = Math.sin(c.tilt) * c.zoom;
    const cos = Math.cos(c.tilt) * c.zoom;
    ctx.transform(
      cos,
      sin,
      -sin,
      cos,
      cos * -p.x - sin * -p.y + ctx.canvas.width * 0.5,
      sin * -p.x + cos * -p.y + ctx.canvas.height * 0.5,
    );
  });
}

function move(world: World) {
  const dt = world.dtMilli / 1000;
  world.query({ and: [Transform, Velocity] }).forEach((e) => {
    const p = World.getComponent(e, Transform);
    const v = World.getComponent(e, Velocity);
    p.x += v.x * dt;
    p.y += v.y * dt;
  });
}

function drawImg(world: World) {
  if (!ctx) return;
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
    ctx.transform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.drawImage(
      img,
      (p.x - imgWidth / 2) / scaleX,
      (p.y - imgHeight / 2) / scaleY,
    );
    ctx.transform(1 / scaleX, 0, 0, 1 / scaleY, 0, 0);
  });
}

function handleButtons(world: World) {
  world.query({ and: [Button, Transform, Rect, Callback] }).forEach((e) => {
    const p = World.getComponent(e, Transform);
    const b = World.getComponent(e, Button);
    const r = World.getComponent(e, Rect);
    const cb = World.getComponent(e, Callback);
    const pressedWithinButton =
      (Pointer.pressPos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (Pointer.pressPos.y - p.y) ** 2 < (r.height / 2) ** 2;
    b.hovered =
      (Pointer.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (Pointer.y - p.y) ** 2 < (r.height / 2) ** 2;
    b.pressed = b.hovered && Pointer.isDown && pressedWithinButton;
    b.clicked =
      Pointer.justReleased &&
      pressedWithinButton &&
      (Pointer.releasePos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (Pointer.releasePos.y - p.y) ** 2 < (r.height / 2) ** 2;
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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
// credit: https://www.30secondsofcode.org/js/s/detect-device-type/
function detectDeviceType(): string {
  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? "Mobile"
    : "Desktop";
}
function getPointerPos(e: PointerEvent) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  Pointer.x = e.x - rect.left;
  Pointer.y = e.y - rect.top;
  if (innerWidth / innerHeight < canvas.width / canvas.height) {
    Pointer.x *= canvas.width / innerWidth;
    Pointer.y *= canvas.width / innerWidth;
  } else {
    Pointer.x *= canvas.height / innerHeight;
    Pointer.y *= canvas.height / innerHeight;
  }
}

const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext("2d");

if (canvas && ctx) {
  canvas.width = config.viewport.width;
  canvas.height = config.viewport.height;
  canvas.style.imageRendering = "pixelated";
  ctx.lineWidth = 0.1;

  document.onkeydown = (e) => {
    Keys[e.key] = true;
  };
  document.onkeyup = (e) => {
    Keys[e.key] = false;
  };
  // document.onpointermove = getPointerPos;
  document.onpointerdown = (e) => {
    if (e.target != canvas) return;
    Pointer.isDown = true;
    Pointer.justPressed = true;
    getPointerPos(e);
    Object.assign(Pointer.pressPos, Pointer);
  };

  document.onpointerup = (e) => {
    Pointer.isDown = false;
    Pointer.justReleased = true;
    getPointerPos(e);
    Object.assign(Pointer.releasePos, Pointer);
  };

  document.body.append(canvas);

  const game = new World();

  const player = addPlayer(game, 0, 0);

  const turrent = addTurrent(game, 10, 0);

  const map = addGraphic(game, "./assets/Map_of_MOBA.svg", 0, 0, 300, 300);

  const cam = addCamera(game, 0, 0);
  const camComponent = World.getComponent(cam, Camera);
  camComponent.targetEntity = player;
  camComponent.isActive = true;

  // addTimerWithCallback(game, (e) => {
  //   const t = World.getComponent(e, Timer);
  //   if (t.timeMilli < 1000 / config.minions.spawnRate) return;
  //   t.reset = true;
  //   const minion = addRect(game, 0, 0);
  //   const v = World.addComponent(minion, Velocity);
  //   const c = Math.cos(-Math.PI / 4);
  //   const s = Math.sin(-Math.PI / 4);
  //   v.x = c * config.minions.speed;
  //   v.y = s * config.minions.speed;
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
    drawBg();
    debugText.content = `FPS: ${Math.ceil(1000 / game.dtMilli)}\nEntity count: ${game.entityCount()}\nDevice type: ${detectDeviceType()}`;
    game.update(
      handleTimers,
      handleCamera,
      handlePathfind,
      handleInput,
      drawImg,
      drawRects,
      drawPathFindTargets,
      move,
    );
    resetTransform(ctx);
    inGameUi.update(drawImg, drawRects, drawTexts, handleButtons);
    Pointer.justReleased = false;
    Pointer.justPressed = false;
    requestAnimationFrame(update);
  })();
}
