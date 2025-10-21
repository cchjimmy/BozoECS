/**
 * By Original PNG version by Raizin, SVG rework by Sameboat. - file:Map of MOBA.png (CC 3.0), CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=29443207
 */

import { entityT, World } from "bozoecs";
import { default as config } from "./config.json" with { type: "json" };

// components
const PIDController = {
  kp: 0,
  ki: 0,
  kd: 0,
  prevErr: 0,
  accumErr: 0,
  currentErr: 0,
  result: 0,
  reset: false,
};
const Stats = {
  attackPoint: 0,
  defencePoint: 0,
  abilityPower: 0,
  moveSpeed: 0,
  attackSpeed: 0,
};
const Health = { current: 0, max: 0 };
const Callback = { callback: new Function() };
const Transform = { x: 0, y: 0, rad: 0, scaleX: 1, scaleY: 1 };
const Velocity = { x: 0, y: 0 };
const PlayerControl = {};
const ComControl = {};
const OnScreen = {};
const ParticleEmitter = {
  spread: 0,
  particleEntity: -1,
  particleLifetimeSeconds: 1,
  speed: 1,
  emit: false,
  particleTransition: function (
    world: World,
    particleEntity: entityT,
    percentageLifeTime: number,
  ) {
    const t = world.getComponent(particleEntity, Transform);
    t.scaleX = t.scaleY = -(percentageLifeTime ** 2) + 1;
  },
};
const Camera = { zoom: 20, tilt: 0, isActive: false, targetEntity: -1 };
const Rect = { width: 1, height: 1, offsetX: 0.5, offsetY: 0.5 };
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
    if (!(e.target instanceof HTMLCanvasElement)) return;
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
function checkOnScreenEntities(world: World) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (!camEntity) return;
  const cam = world.getComponent(camEntity, Camera);
  const camTransform = world.getComponent(camEntity, Transform);
  world.query({ and: [Rect, Transform] }).forEach((e) => {
    world.removeComponent(e, OnScreen);
    const r = world.getComponent(e, Rect);
    const t = world.getComponent(e, Transform);
    rectsOverlap(
      camTransform.x,
      camTransform.y,
      Ctx2D.canvas.width / cam.zoom,
      Ctx2D.canvas.height / cam.zoom,
      t.x + r.offsetX + r.width / 2,
      t.y + r.offsetY + r.height / 2,
      r.width,
      r.height,
    ) && world.addComponent(e, OnScreen);
  });
}
function handlePIDControllers(world: World) {
  world.query({ and: [PIDController] }).forEach((e) => {
    const pid = world.getComponent(e, PIDController);
    pid.result =
      pid.kp * pid.currentErr +
      pid.ki * pid.accumErr +
      (pid.kd * (pid.currentErr - pid.prevErr) * 1000) / Time.dtMilli;
    pid.prevErr = pid.currentErr * +!pid.reset;
    pid.accumErr = (pid.accumErr + pid.currentErr) * +!pid.reset;
  });
}
function handleParticleEmitters(world: World) {
  world.query({ and: [ParticleEmitter, Transform] }).forEach((e) => {
    const emitter = world.getComponent(e, ParticleEmitter);
    if (!emitter.emit || !world.hasComponent(emitter.particleEntity, Transform))
      return;
    emitter.emit = false;
    const t = world.getComponent(e, Transform);
    const particle = world.copyEntity(emitter.particleEntity);
    const particleTransform = world.getComponent(particle, Transform);
    Object.assign(particleTransform, t);
    const timer = world.addComponent(particle, Timer);
    const rand = Math.random() > 0.5;
    const radian =
      t.rad + Math.random() * emitter.spread * Math.PI * (-1 * +rand + +!rand);
    particleTransform.rad = radian;
    world.addComponent(particle, Velocity, {
      x: Math.cos(radian) * emitter.speed,
      y: Math.sin(radian) * emitter.speed,
    });
    world.addComponent(particle, Callback).callback = () => {
      if (timer.timeMilli < emitter.particleLifetimeSeconds * 1000) {
        emitter.particleTransition(
          world,
          particle,
          timer.timeMilli / 1000 / emitter.particleLifetimeSeconds,
        );
        return;
      }
      world.deleteEntity(particle);
    };
  });
}
function handleInput(world: World) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (camEntity == undefined) return;
  const camera = world.getComponent(camEntity, Camera);
  const camTransform = world.getComponent(camEntity, Transform);
  const pressPos = pointerToScreen(Pointer.pressPos, Ctx2D.canvas);
  world.query({ and: [PathFinder, PlayerControl] }).forEach((e) => {
    const pf = world.getComponent(e, PathFinder);
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
      const pf = world.getComponent(e, PathFinder);
      const p = world.getComponent(e, Transform);
      const v = world.getComponent(e, Velocity);
      const s = world.getComponent(e, Stats);

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
  world
    .query({ and: [Timer, Callback] })
    .forEach((e) => world.getComponent(e, Callback).callback(e));
  world.query({ and: [Timer] }).forEach((e) => {
    const t = world.getComponent(e, Timer);
    if (t.reset) t.timeMilli = 0;
    t.reset = false;
    if (!t.stop) t.timeMilli += Time.dtMilli;
  });
}
function drawTexts(world: World) {
  world.query({ and: [Text, Transform] }).forEach((e) => {
    const t = world.getComponent(e, Text);
    const p = world.getComponent(e, Transform);
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
function drawRects(world: World) {
  world.query({ and: [Transform, Rect, Colour, OnScreen] }).forEach((e) => {
    const p = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const c = world.getComponent(e, Colour);
    const oldF = Ctx2D.ctx.fillStyle;
    const oldS = Ctx2D.ctx.strokeStyle;
    Ctx2D.ctx.fillStyle = c.fill;
    Ctx2D.ctx.strokeStyle = c.stroke;
    const cos = Math.cos(p.rad);
    const sin = Math.sin(p.rad);
    Ctx2D.ctx.transform(cos, sin, -sin, cos, p.x, p.y);
    Ctx2D.ctx.fillRect(
      r.offsetX * p.scaleX,
      r.offsetY * p.scaleY,
      r.width * p.scaleX,
      r.height * p.scaleY,
    );
    Ctx2D.ctx.strokeRect(
      r.offsetX * p.scaleX,
      r.offsetY * p.scaleY,
      r.width * p.scaleX,
      r.height * p.scaleY,
    );
    Ctx2D.ctx.transform(
      cos,
      -sin,
      sin,
      cos,
      cos * -p.x + sin * -p.y,
      -sin * -p.x + cos * -p.y,
    );
    Ctx2D.ctx.fillStyle = oldF;
    Ctx2D.ctx.strokeStyle = oldS;
  });
}
function drawPathFindTargets(world: World) {
  const old = Ctx2D.ctx.fillStyle;
  Ctx2D.ctx.fillStyle = "red";
  world.query({ and: [PathFinder] }).forEach((e) => {
    const pf = world.getComponent(e, PathFinder);
    Ctx2D.ctx.fillRect(pf.targetX - 0.5, pf.targetY - 0.5, 1, 1);
  });
  Ctx2D.ctx.fillStyle = old;
}
function handleCamera(world: World) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (!camEntity) return;
  Ctx2D.ctx.resetTransform();
  const c = world.getComponent(camEntity, Camera);
  const p = world.getComponent(camEntity, Transform);
  if (c.targetEntity != -1 && world.hasComponent(c.targetEntity, Transform)) {
    const targetPos = world.getComponent(c.targetEntity, Transform);
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
}
function move(world: World) {
  const dt = Time.dtMilli / 1000;
  world.query({ and: [Transform, Velocity] }).forEach((e) => {
    const p = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    p.x += v.x * dt;
    p.y += v.y * dt;
  });
}
function drawImg(world: World) {
  world.query({ and: [Graphic, Transform] }).forEach((e) => {
    const g = world.getComponent(e, Graphic);
    const p = world.getComponent(e, Transform);
    const r = world.hasComponent(e, Rect) && world.getComponent(e, Rect);
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
    const p = world.getComponent(e, Transform);
    const b = world.getComponent(e, Button);
    const r = world.getComponent(e, Rect);
    const cb = world.getComponent(e, Callback);
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
function drawHealthBars(world: World) {
  world.query({ and: [OnScreen, Health, Transform, Rect] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const h = world.getComponent(e, Health);
    const oldStroke = Ctx2D.ctx.strokeStyle;
    const oldFill = Ctx2D.ctx.fillStyle;
    const oldLineWidth = Ctx2D.ctx.lineWidth;
    Ctx2D.ctx.fillStyle = "black";
    const width = r.width * 1.5;
    Ctx2D.ctx.fillRect(
      t.x - width / 2,
      t.y + r.offsetY * t.scaleY - 1,
      width,
      0.3,
    );
    Ctx2D.ctx.fillStyle = "green";
    Ctx2D.ctx.fillRect(
      t.x - width / 2,
      t.y + r.offsetY * t.scaleY - 1,
      width * (h.current / h.max),
      0.3,
    );
    Ctx2D.ctx.strokeStyle = "black";
    Ctx2D.ctx.lineWidth = 0.1;
    Ctx2D.ctx.strokeRect(
      t.x - width / 2,
      t.y + r.offsetY * t.scaleY - 1,
      width,
      0.3,
    );
    Ctx2D.ctx.strokeStyle = oldStroke;
    Ctx2D.ctx.fillStyle = oldFill;
    Ctx2D.ctx.lineWidth = oldLineWidth;
  });
}

// entities
function addGraphic(world: World, src: string, x = 0, y = 0, w = 1, h = 1) {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Graphic, { src });
  world.addComponent(e, Rect, { width: w, height: h });
  return e;
}
function addRect(
  world: World,
  x = 0,
  y = 0,
  w = 1,
  h = 1,
  offsetX = -w / 2,
  offsetY = -h / 2,
) {
  const e = world.createEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Rect, { width: w, height: h, offsetX, offsetY });
  world.addComponent(e, Colour);
  world.addComponent(e, OnScreen);
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
  const e = addRect(world, x, y, w, h);
  world.addComponent(e, Button);
  world.addComponent(e, Colour);
  world.addComponent(e, Callback, { callback: cb });
  return e;
}
function addTimerWithCallback(world: World, cb: (e: entityT) => void) {
  const e = world.createEntity();
  world.addComponent(e, Timer);
  world.addComponent(e, Callback).callback = cb;
  return e;
}
function addPlayer(world: World, x = 0, y = 0) {
  const player = addRect(world, x, y, 1, 1);
  world.addComponent(player, Velocity);
  world.addComponent(player, Stats, {
    ...config.entities.player,
  });
  world.addComponent(player, Health, {
    max: config.entities.player.healthPoint,
    current: config.entities.player.healthPoint,
  });
  world.addComponent(player, PlayerControl);
  world.addComponent(player, PathFinder, { targetX: x, targetY: y });
  return player;
}
function addTurrent(world: World, x: number, y: number) {
  const turrent = addRect(world, x, y, 3, 10, -1.5, -10);
  world.addComponent(turrent, Stats, { ...config.entities.turrent });
  world.addComponent(turrent, Health, {
    max: config.entities.turrent.healthPoint,
    current: config.entities.turrent.healthPoint,
  });
  return turrent;
}
function addCamera(world: World, x: number, y: number) {
  const cam = world.createEntity();
  world.addComponent(cam, Camera, { zoom: 30 });
  world.addComponent(cam, Transform, { x, y });
  return cam;
}

//utils
function drawBg(color: string = "#424242") {
  const old = Ctx2D.ctx.fillStyle;
  Ctx2D.ctx.fillStyle = color;
  Ctx2D.ctx.fillRect(0, 0, Ctx2D.canvas.width, Ctx2D.canvas.height);
  Ctx2D.ctx.fillStyle = old;
}
function rectsOverlap(
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

// initialization
Ctx2D.canvas.width = config.viewport.width;
Ctx2D.canvas.height = config.viewport.height;
Ctx2D.canvas.style.imageRendering = "pixelated";
Ctx2D.ctx.lineWidth = 0.1;

const game = new World();

const turrent = addTurrent(game, 10, 0);
game.addComponent(turrent, ParticleEmitter, {
  particleEntity: turrent,
  speed: 20,
  spread: 0.2,
});
game.addComponent(turrent, Timer);
game.addComponent(turrent, Callback).callback = (e: entityT) => {
  const t = game.getComponent(e, Timer);
  if (t.timeMilli < 50) return;
  t.reset = true;
  game.getComponent(e, ParticleEmitter).emit = true;
};

for (let i = 0; i < 2; i++) {
  game.getComponent(game.copyEntity(turrent), Transform).y += 15 * (i + 1);
}

const player = addPlayer(game, 0, 0);
game.getComponent(player, Health).current *= 0.6;

const map = addGraphic(game, "./assets/Map_of_MOBA.svg", 0, 0, 300, 300);

const cam = addCamera(game, 0, 0);
const camComponent = game.getComponent(cam, Camera);
camComponent.targetEntity = player;
camComponent.isActive = true;
camComponent.zoom = 15;

const inGameUi = new World(1 / 60);

addButton(
  inGameUi,
  config.viewport.width * 0.9,
  config.viewport.height * 0.8,
  config.viewport.height * 0.3,
  config.viewport.height * 0.3,
  (e) => {
    const b = inGameUi.getComponent(e, Button);
    b.clicked && console.log("clicked");
  },
);

const debugTextEntity = inGameUi.createEntity();
const debugText = inGameUi.addComponent(debugTextEntity, Text, {
  content: "test string",
  backgroundColor: "white",
});
inGameUi.addComponent(debugTextEntity, Transform);

(function update() {
  debugText.content = `FPS: ${Math.ceil(1000 / Time.dtMilli)}\nEntity count: ${game.entityCount()}\nDevice type: ${detectDeviceType()}`;

  // drawing
  drawBg();
  game.update(
    handleCamera,
    checkOnScreenEntities,
    drawImg,
    drawRects,
    //drawPathFindTargets,
    drawHealthBars,
  );
  Ctx2D.ctx.resetTransform();
  inGameUi.update(drawImg, drawRects, drawTexts);

  // processing
  inGameUi.update(handleButtons);
  game.update(
    handleTimers,
    handlePathfind,
    handleInput,
    handleParticleEmitters,
    move,
  );

  pointerUpdate(Pointer);
  keyboardUpdate(Keys);
  timeUpdate(Time);
  requestAnimationFrame(update);
})();
