/**
 * By Original PNG version by Raizin, SVG rework by Sameboat. - file:Map of MOBA.png (CC 3.0), CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=29443207
 */

import { entityT, World } from "../../../src/index.ts";
import { default as config } from "./config.json" with { type: "json" };

// components
const Combat = {
  healthPoint: 0,
  attackPoint: 0,
  defencePoint: 0,
  abilityPower: 0,
};
const Transform = {
  x: 0,
  y: 0,
};
const Velocity = {
  x: 0,
  y: 0,
};
const PlayerControl = {};
const Camera = {
  zoom: 1,
  tilt: 0,
  isActive: false,
};
const Rect = {
  width: 2,
  height: 2,
};
const Graphic = {
  src: "",
};
const Button = {
  hovered: false,
  pressed: false,
  clicked: false,
  callback: (_: entityT) => {},
};
const Colour = {
  fill: "white",
  stroke: "black",
};
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

// systems
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

function handleInput(world: World) {
  world.query({ and: [PlayerControl, Velocity], or: [Camera] }).forEach((e) => {
    const v = World.getComponent(e, Velocity);
    v.x = 0;
    v.y = 0;
    if (keys["w"] || keys["ArrowUp"]) {
      v.y--;
    }
    if (keys["a"] || keys["ArrowLeft"]) {
      v.x--;
    }
    if (keys["s"] || keys["ArrowDown"]) {
      v.y++;
    }
    if (keys["d"] || keys["ArrowRight"]) {
      v.x++;
    }
    const mag = (v.x ** 2 + v.y ** 2) ** 0.5;
    if (mag != 0) {
      v.x = v.x / mag * config.player.speed;
      v.y = v.y / mag * config.player.speed;
    }

    if (!World.hasComponent(e, Camera)) return;
    const c = World.getComponent(e, Camera);
    const dt = world.dtMilli / 1000;
    if (keys["q"]) c.tilt -= 5 * dt;
    if (keys["e"]) c.tilt += 5 * dt;
  });
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
      -sin * c.zoom,
      sin * c.zoom,
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
      (mouse.pressPos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (mouse.pressPos.y - p.y) ** 2 < (r.height / 2) ** 2;

    b.hovered = (mouse.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (mouse.y - p.y) ** 2 < (r.height / 2) ** 2;
    b.pressed = b.hovered && mouse.isDown && pressedWithinButton;
    b.clicked = mouse.justReleased && pressedWithinButton &&
      (mouse.releasePos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
      (mouse.releasePos.y - p.y) ** 2 < (r.height / 2) ** 2;
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
const keys: Record<string, boolean> = {};
const mouse = {
  x: 0,
  y: 0,
  isDown: false,
  pressPos: { x: 0, y: 0 },
  justReleased: false,
  releasePos: { x: 0, y: 0 },
};

if (canvas && ctx) {
  canvas.width = config.viewport.width;
  canvas.height = config.viewport.height;
  canvas.style.imageRendering = "pixelated";
  ctx.lineWidth = 0.1;

  document.onkeydown = (e) => {
    keys[e.key] = true;
  };
  document.onkeyup = (e) => {
    delete keys[e.key];
  };
  document.onpointermove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.x - rect.left;
    mouse.y = e.y - rect.top;
    if (innerWidth / innerHeight < canvas.width / canvas.height) {
      mouse.x *= canvas.width / innerWidth;
      mouse.y *= canvas.width / innerWidth;
    } else {
      mouse.x *= canvas.height / innerHeight;
      mouse.y *= canvas.height / innerHeight;
    }
  };
  document.onpointerdown = () => {
    mouse.isDown = true;
    mouse.pressPos.x = mouse.x;
    mouse.pressPos.y = mouse.y;
  };
  document.onpointerup = () => {
    mouse.isDown = false;
    mouse.justReleased = true;
    mouse.releasePos.x = mouse.x;
    mouse.releasePos.y = mouse.y;
  };

  document.body.append(canvas);

  const game = new World();

  const player = addRect(game, 0, 0);
  const r = World.getComponent(player, Rect);
  r.width = 1;
  r.height = 1;
  const camera = World.addComponent(player, Camera);
  camera.zoom = 30;
  camera.isActive = true;
  World.addComponent(player, PlayerControl);

  addGraphic(game, "./assets/Map_of_MOBA.svg", 0, 0, 300, 300);

  const mouseRect = addRect(game, 0, 0);

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
    const p = World.getComponent(mouseRect, Transform);
    const worldPos = screenToWorld(
      mouse,
      World.getComponent(player, Transform),
      camera.tilt,
      camera.zoom,
    );
    p.x = worldPos.x;
    p.y = worldPos.y;
    game.update(
      handleInput,
      //handleTimers,
      handleCamera,
      drawImg,
      drawRects,
      move,
    );
    resetTransform();
    inGameUi.update(
      drawImg,
      drawRects,
      //drawTexts,
      handleButtons,
    );
    mouse.justReleased = false;
    requestAnimationFrame(update);
  })();
}
