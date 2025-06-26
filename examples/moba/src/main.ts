/**
 * By Original PNG version by Raizin, SVG rework by Sameboat. - file:Map of MOBA.png (CC 3.0), CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=29443207
 */

import { entityT, World } from "../../../src/index.ts";
import { default as config } from "./config.json" with { type: "json" };

// components
const Speed = { max: 100 };
const Combat = {
  healthPoint: 0,
  attackPoint: 0,
  defencePoint: 0,
  abilityPower: 0,
};
const Transform = { x: 0, y: 0, rad: 0, scaleX: 1, scaleY: 1 };
const Velocity = { x: 0, y: 0 };
const PlayerControl = {};
const Camera = { zoom: 1, tilt: 0, isActive: false };
const Rect = { width: 2, height: 2 };
const Graphic = { src: "" };
const Button = {
  hovered: false,
  pressed: false,
  clicked: false,
  callback: (_: entityT) => {},
};
const Colour = { fill: "white", stroke: "black" };
const Text = {
  content: "",
  fontSize: 20,
  padding: 3,
  color: "black",
  backgroundColor: "white",
};
const Timer = {
  durationMilli: 1000,
  startMilli: 0,
  callback: (_: entityT) => {},
};
const PathFinder = {
  targetX: 0,
  targetY: 0,
  deactivateTolerance: 1,
};

// singletons
const Mouse = {
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
  world.query({ and: [PathFinder, Camera, PlayerControl, Transform] }).forEach(
    (e) => {
      const pf = World.getComponent(e, PathFinder);
      const c = World.getComponent(e, Camera);
      const p = World.getComponent(e, Transform);
      if (Mouse.justPressed) {
        const worldPos = screenToWorld(
          { x: Mouse.x, y: Mouse.y },
          p,
          c.tilt,
          c.zoom,
        );
        pf.targetX = worldPos.x;
        pf.targetY = worldPos.y;
      }
      if (Keys["q"]) {
        c.tilt += 1 * world.dtMilli / 1000;
      }
      if (Keys["e"]) {
        c.tilt -= 1 * world.dtMilli / 1000;
      }
    },
  );
}

function handlePathfind(world: World) {
  world.query({ and: [PathFinder, Transform, Velocity, Speed] }).forEach(
    (e) => {
      // tap to move
      const pf = World.getComponent(e, PathFinder);
      const p = World.getComponent(e, Transform);
      const v = World.getComponent(e, Velocity);
      const s = World.getComponent(e, Speed);

      const dx = pf.targetX - p.x;
      const dy = pf.targetY - p.y;
      const dMag = (dx * dx + dy * dy) ** 0.5;

      if (dMag < pf.deactivateTolerance) {
        v.x = v.y = 0;
        return;
      }

      v.x = dx / dMag * s.max;
      v.y = dy / dMag * s.max;
    },
  );
}

function handleTimers(world: World) {
  world.query({ and: [Timer] }).forEach((e) => {
    const t = World.getComponent(e, Timer);
    if (world.timeMilli - t.startMilli < t.durationMilli) return;
    t.startMilli = world.timeMilli;
    t.callback(e);
  });
}

function drawTexts(world: World) {
  if (!ctx) return;
  world.query({ and: [Text, Transform] }).forEach((e) => {
    const t = World.getComponent(e, Text);
    const p = World.getComponent(e, Transform);

    ctx.font = `${t.fontSize}px serif`;
    const txtMetric = ctx.measureText(t.content);
    const old = ctx.fillStyle;
    ctx.fillStyle = t.backgroundColor;
    ctx.fillRect(
      p.x,
      p.y,
      t.padding * 2 + txtMetric.width,
      t.padding * 2 + txtMetric.fontBoundingBoxAscent,
    );
    ctx.fillStyle = t.color;
    ctx.fillText(
      t.content,
      p.x + t.padding,
      p.y + t.padding + txtMetric.fontBoundingBoxAscent,
    );
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
    `M ${p.x - r.width * 0.5} ${
      p.y - r.height * 0.5
    } h ${r.width} v ${r.height} h ${-r.width} Z`,
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

function drawBg() {
  if (!ctx) return;
  const old = ctx.fillStyle;
  ctx.fillStyle = "#424242";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = old;
}

function handleCamera(world: World) {
  world.query({ and: [Camera, Transform, Velocity] }).forEach((e) => {
    const c = World.getComponent(e, Camera);
    if (!ctx || !c.isActive) return;
    const p = World.getComponent(e, Transform);
    const sin = Math.sin(c.tilt);
    const cos = Math.cos(c.tilt);
    const translateX = -p.x * c.zoom;
    const translateY = -p.y * c.zoom;
    ctx.transform(
      cos * c.zoom,
      sin * c.zoom,
      -sin * c.zoom,
      cos * c.zoom,
      // inverse rotation
      cos * translateX + sin * translateY + ctx.canvas.width * 0.5,
      -sin * translateX + cos * translateY + ctx.canvas.height * 0.5,
    );
    const v = World.getComponent(e, Velocity);
    const x = v.x;
    const y = v.y;
    v.x = cos * x - sin * y;
    v.y = sin * x + cos * y;
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
  world.query({ and: [Graphic, Transform], or: [Rect] }).forEach((e) => {
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
  world.query({ and: [Button, Transform, Rect] }).forEach((e) => {
    const p = World.getComponent(e, Transform);
    const b = World.getComponent(e, Button);
    const r = World.getComponent(e, Rect);
    const pressedWithinButton =
      (Mouse.pressPos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (Mouse.pressPos.y - p.y) ** 2 < (r.height / 2) ** 2;

    b.hovered = (Mouse.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (Mouse.y - p.y) ** 2 < (r.height / 2) ** 2;
    b.pressed = b.hovered && Mouse.isDown && pressedWithinButton;
    b.clicked = Mouse.justReleased && pressedWithinButton &&
      (Mouse.releasePos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (Mouse.releasePos.y - p.y) ** 2 < (r.height / 2) ** 2;
    b.callback(e);
  });
}

function resetTransform() {
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// entities
function addGraphic(world: World, src: string, x = 0, y = 0, w = 1, h = 1) {
  const e = world.addEntity();
  const p = World.addComponent(e, Transform);
  const g = World.addComponent(e, Graphic);
  const r = World.addComponent(e, Rect);
  p.x = x;
  p.y = y;
  g.src = src;
  r.width = w;
  r.height = h;
  return e;
}

function addRect(world: World, x: number = 0, y: number = 0) {
  const e = world.addEntity();
  const p = World.addComponent(e, Transform);
  World.addComponent(e, Velocity);
  World.addComponent(e, Speed);
  World.addComponent(e, Rect);
  const c = World.addComponent(e, Colour);
  c.fill = "green";
  //c.stroke = "transparent";
  p.x = x;
  p.y = y;
  return e;
}

function addButton(
  world: World,
  x = 0,
  y = 0,
  w = 10,
  h = 10,
  cb: (e: entityT) => void = () => {},
) {
  const e = world.addEntity();
  const p = World.addComponent(e, Transform);
  const r = World.addComponent(e, Rect);
  const b = World.addComponent(e, Button);
  World.addComponent(e, Colour);
  p.x = x;
  p.y = y;
  r.width = w;
  r.height = h;
  b.callback = cb;
  return e;
}

function addTimer(
  world: World,
  durationMilli: number,
  callback: (e: entityT) => void = () => {},
) {
  const e = world.addEntity();
  const t = World.addComponent(e, Timer);
  t.durationMilli = durationMilli;
  t.callback = callback;
  return e;
}

function addPlayer(world: World) {
  const player = addRect(world, 0, 0);
  const r = World.getComponent(player, Rect);
  r.width = 1;
  r.height = 1;
  const s = World.getComponent(player, Speed);
  s.max = 10;
  const camera = World.addComponent(player, Camera);
  camera.zoom = 30;
  camera.isActive = true;
  World.addComponent(player, PlayerControl);
  World.addComponent(player, PathFinder);
  return player;
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
  res.x = cos * x - sin * y;
  res.y = sin * x + cos * y;
  res.x /= cameraZoom;
  res.y /= cameraZoom;
  res.x += cameraPos.x;
  res.y += cameraPos.y;
  return res;
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
    delete Keys[e.key];
  };
  document.onpointermove = (e) => {
    const rect = canvas.getBoundingClientRect();
    Mouse.x = e.x - rect.left;
    Mouse.y = e.y - rect.top;
    if (innerWidth / innerHeight < canvas.width / canvas.height) {
      Mouse.x *= canvas.width / innerWidth;
      Mouse.y *= canvas.width / innerWidth;
    } else {
      Mouse.x *= canvas.height / innerHeight;
      Mouse.y *= canvas.height / innerHeight;
    }
  };

  document.onpointerdown = () => {
    Mouse.isDown = true;
    Mouse.justPressed = true;
    Object.assign(Mouse.pressPos, Mouse);

    const mp = World.getComponent(mouseRect, Transform);
    const pp = World.getComponent(player, Transform);
    const c = World.getComponent(player, Camera);
    const worldPos = screenToWorld(Mouse, pp, c.tilt, c.zoom);
    Object.assign(mp, worldPos);
  };

  document.onpointerup = () => {
    Mouse.isDown = false;
    Mouse.justReleased = true;
    Object.assign(Mouse.releasePos, Mouse);
  };

  document.body.append(canvas);

  const game = new World();

  const player = addPlayer(game);

  const mouseRect = addRect(game);

  addGraphic(game, "./assets/Map_of_MOBA.svg", 0, 0, 300, 300);

  //addTimer(game, 1000, () => {
  //  const minion = addRect(game, 0, 0);
  //  const v = game.getComponent(minion, Velocity);
  //  const speed = 10;
  //  const c = Math.cos(-Math.PI / 4);
  //  const s = Math.sin(-Math.PI / 4);
  //  v.x = c * speed;
  //  v.y = s * speed;
  //});

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
  addGraphic(
    inGameUi,
    "./assets/Map_of_MOBA.svg",
    config.viewport.width * 0.1,
    config.viewport.height * 0.2,
    config.viewport.height * 0.3,
    config.viewport.height * 0.3,
  );

  (function update() {
    drawBg();
    game.update(
      handleTimers,
      handleCamera,
      handlePathfind,
      handleInput,
      drawImg,
      drawRects,
      move,
    );
    resetTransform();
    inGameUi.update(
      drawImg,
      drawRects,
      drawTexts,
      handleButtons,
    );
    Mouse.justReleased = false;
    Mouse.justPressed = false;
    requestAnimationFrame(update);
  })();
}
