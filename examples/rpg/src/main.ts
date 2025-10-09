import { World } from "../../../src/index.ts";

// components
const Transform = { x: 0, y: 0, rad: 0, scaleX: 0, scaleY: 0 };
const Velocity = { x: 0, y: 0 };
const Rect = { width: 10, height: 10 };
const Camera = { zoom: 4 };
const PlayerControl = {};

// singletons
const Ctx2D = setUpCanvas2D();
const Pointer = setUpPointer();
const Keys = setUpKeyboard();
const Assets: HTMLImageElement[] = [];
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

function keysUpdate(
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
function handleDrawing(world: World) {
  const oldF = Ctx2D.ctx.fillStyle;

  Ctx2D.ctx.fillStyle = "white";
  Ctx2D.ctx.beginPath();
  world.query({ and: [Transform, Rect] }).forEach((e) => {
    const t = World.getComponent(e, Transform);
    const r = World.getComponent(e, Rect);
    Ctx2D.ctx.rect(
      t.x - r.width * 0.5,
      t.y - r.height * 0.5,
      r.width,
      r.height,
    );
  });
  Ctx2D.ctx.fill();

  Ctx2D.ctx.transform(1, 0, 0, -1, 0, 0);
  Ctx2D.ctx.drawImage(Assets[0], 0, 0, 10, 10, 0, 0, 10, 10);
  Ctx2D.ctx.transform(1, 0, 0, -1, 0, 0);

  Ctx2D.ctx.fillStyle = oldF;
}

function handleInput(world: World) {
  world.query({ and: [Velocity, PlayerControl] }).forEach((e) => {
    const v = World.getComponent(e, Velocity);
    v.x = +!!Keys.isDown["d"] - +!!Keys.isDown["a"];
    v.y = +!!Keys.isDown["w"] - +!!Keys.isDown["s"];
    const speed = 100;
    ((v.x *= speed), (v.y *= speed));

    Pointer.justPressed && console.log("action");
  });
}

function handleMovement(world: World) {
  world.query({ and: [Transform, Velocity] }).forEach((e) => {
    const t = World.getComponent(e, Transform);
    const v = World.getComponent(e, Velocity);
    t.x += (v.x * Time.dtMilli) / 1000;
    t.y += (v.y * Time.dtMilli) / 1000;
  });
}

function handleCamera(world: World) {
  world.query({ and: [Transform, Camera] }).forEach((e) => {
    const t = World.getComponent(e, Transform);
    const c = World.getComponent(e, Camera);
    Ctx2D.ctx.setTransform(
      c.zoom,
      0,
      0,
      -c.zoom,
      -t.x * c.zoom + Ctx2D.canvas.width * 0.5,
      t.y * c.zoom + Ctx2D.canvas.height * 0.5,
    );
  });
}

// entities
function addRect(
  world: World,
  x = 0,
  y = 0,
  rad = 0,
  w = Rect.width,
  h = Rect.height,
) {
  const e = world.addEntity();
  const t = World.addComponent(e, Transform);
  ((t.x = x), (t.y = y), (t.rad = rad));
  const r = World.addComponent(e, Rect);
  ((r.width = w), (r.height = h));
  return e;
}

function addPlayer(world: World) {
  const player = world.addEntity();
  World.addComponent(player, Transform);
  World.addComponent(player, Velocity);
  World.addComponent(player, PlayerControl);
  World.addComponent(player, Camera);
  return player;
}

// initialization
Ctx2D.canvas.style.imageRendering = "pixelated";
Ctx2D.ctx.imageSmoothingEnabled = false;

const atlas = new Image();
atlas.src = "./assets/roguelike_atlas.png";
Assets.push(atlas);

const game = new World();
addPlayer(game);
addRect(game, 10, 10);
addRect(game, -10, -10);

(function loop() {
  const oldF = Ctx2D.ctx.fillStyle;
  Ctx2D.ctx.fillStyle = "blue";
  Ctx2D.ctx.resetTransform();
  Ctx2D.ctx.fillRect(0, 0, Ctx2D.canvas.width, Ctx2D.canvas.height);
  Ctx2D.ctx.fillStyle = oldF;

  game.update(handleCamera, handleDrawing, handleInput, handleMovement);
  pointerUpdate(Pointer);
  keysUpdate(Keys);
  timeUpdate(Time);
  requestAnimationFrame(loop);
})();
