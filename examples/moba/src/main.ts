/**
 * By Original PNG version by Raizin, SVG rework by Sameboat. - file:Map of MOBA.png (CC 3.0), CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=29443207
 */

import { Component, entityT, World } from "../../../src/index.ts";
import { default as config } from "./config.json" with { type: "json" };

// components
class Position extends Component {
  x = 0;
  y = 0;
}
class Velocity extends Component {
  x = 0;
  y = 0;
}
class PlayerControl extends Component {}
class Camera extends Component {
  zoom = 1;
  tilt = 0;
  isActive = false;
}
class Rect extends Component {
  width = 2;
  height = 2;
}
class Graphic extends Component {
  src = "";
}
class Button extends Component {
  hovered = false;
  pressed = false;
  clicked = false;
  callback: (e: entityT) => void = () => {};
}
class Colour extends Component {
  fill = "white";
  stroke = "black";
}
class Text extends Component {
  content = "";
  fontSize = 20;
  padding = 3;
  color = "black";
  backgroundColor = "white";
}
class Timer extends Component {
  durationMilli = 1000;
  startMilli = 0;
  callback: (e: entityT) => void = () => {};
}

// systems
function handleTimers(world: World) {
  world.query({ and: [Timer] }).forEach((e) => {
    const t = world.getComponent(e, Timer);
    if (world.time - t.startMilli < t.durationMilli) return;
    t.startMilli = world.time;
    t.callback(e);
  });
}
function drawTexts(world: World) {
  if (!ctx) return;
  world.query({ and: [Text, Position] }).forEach((e) => {
    const t = world.getComponent(e, Text);
    const p = world.getComponent(e, Position);

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

function drawRects(world: World) {
  world.query({ and: [Position, Rect, Colour], not: [Button] }).forEach((e) => {
    if (!ctx) return;
    const p = world.getComponent(e, Position);
    const r = world.getComponent(e, Rect);
    const c = world.getComponent(e, Colour);
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
  world.query({ and: [PlayerControl, Velocity, Camera] }).forEach((e) => {
    const v = world.getComponent(e, Velocity);
    v.x = 0;
    v.y = 0;
    if (keys["w"] || keys["ArrowUp"]) {
      v.y++;
    }
    if (keys["a"] || keys["ArrowLeft"]) {
      v.x--;
    }
    if (keys["s"] || keys["ArrowDown"]) {
      v.y--;
    }
    if (keys["d"] || keys["ArrowRight"]) {
      v.x++;
    }
    const mag = (v.x ** 2 + v.y ** 2) ** 0.5;
    if (mag == 0) return;
    const c = world.getComponent(e, Camera);
    const cos = Math.cos(c.tilt);
    const sin = Math.sin(c.tilt);
    const x = v.x = v.x / mag * config.player.speed;
    const y = v.y = v.y / mag * config.player.speed;
    v.x = cos * x - sin * y;
    v.y = sin * x + cos * y;
  });
}

function handleCamera(world: World) {
  world.query({ and: [Camera, Position] }).forEach((e) => {
    const c = world.getComponent(e, Camera);
    if (!ctx || !c.isActive) return;
    const p = world.getComponent(e, Position);
    const sin = Math.sin(c.tilt);
    const cos = Math.cos(c.tilt);
    const translateX = -p.x * c.zoom;
    const translateY = -p.y * -c.zoom;
    ctx.setTransform(
      cos * c.zoom,
      -sin * -c.zoom,
      sin * c.zoom,
      cos * -c.zoom,
      translateX * cos + translateY * -sin + ctx.canvas.width * 0.5,
      translateX * sin + translateY * cos + ctx.canvas.height * 0.5,
    );
  });
}

function move(world: World, dt: number) {
  world.query({ and: [Position, Velocity] }).forEach((e) => {
    const p = world.getComponent(e, Position);
    const v = world.getComponent(e, Velocity);
    p.x += v.x * dt;
    p.y += v.y * dt;
  });
}

function drawImg(world: World) {
  if (!ctx) return;
  world.query({ and: [Graphic, Position], or: [Rect] }).forEach((e) => {
    const g = world.getComponent(e, Graphic);
    const p = world.getComponent(e, Position);
    const r = World.hasComponent(e, Rect) && world.getComponent(e, Rect);
    const img = new Image();
    img.src = g.src;
    const scaleX = r ? r.width / img.width : 1;
    const scaleY = r ? r.height / img.height : 1;
    ctx.transform(scaleX, 0, 0, -scaleY, p.x, p.y);
    ctx.drawImage(img, 0, 0);
    ctx.transform(1 / scaleX, 0, 0, 1 / -scaleY, -p.x / scaleX, p.y / scaleY);
  });
}

function handleButtons(world: World) {
  world.query({ and: [Button, Position, Rect] }).forEach((e) => {
    const p = world.getComponent(e, Position);
    const b = world.getComponent(e, Button);
    const r = world.getComponent(e, Rect);
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

function drawButtons(world: World) {
  world.query({ and: [Position, Button, Rect] }).forEach((e) => {
    if (!ctx) return;
    const p = world.getComponent(e, Position);
    const r = world.getComponent(e, Rect);
    const old = ctx.fillStyle;
    ctx.fillStyle = "green";
    ctx.fillRect(p.x - r.width * 0.5, p.y - r.height * 0.5, r.width, r.height);
    ctx.fillStyle = old;
  });
}

// entities
function addGraphic(world: World, src: string, x = 0, y = 0, w = 1, h = 1) {
  const e = world.addEntity();
  const p = World.addComponent(e, Position);
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
  const p = World.addComponent(e, Position);
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
  x: number = 0,
  y: number = 0,
  w: number = 10,
  h: number = 10,
  cb: (e: entityT) => void = () => {},
) {
  const e = world.addEntity();
  const p = World.addComponent(e, Position);
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

const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext("2d");
const keys: Record<string, boolean> = {};
const mouse = {
  x: -1,
  y: -1,
  isDown: false,
  pressPos: { x: -1, y: -1 },
  justReleased: false,
  releasePos: { x: 0, y: 0 },
};

if (canvas && ctx) {
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

  const w = new World();

  const player = addRect(w, 0, 0);
  const r = w.getComponent(player, Rect);
  r.width = 1;
  r.height = 1;
  const camera = World.addComponent(player, Camera);
  camera.zoom = 10;
  //camera.tilt = Math.PI / 4;
  camera.isActive = true;
  World.addComponent(player, PlayerControl);

  addGraphic(w, "./assets/Map_of_MOBA.svg", 0, 300, 300, 300);

  addButton(w, 25, 15, 50, 30, (e) => {
    const b = w.getComponent(e, Button);
    b.clicked && console.log("clicked");
  });

  addTimer(w, 1000, () => console.log("TimerUp"));

  (function update() {
    w.update(
      drawBg,
      handleCamera,
      drawImg,
      drawRects,
      resetTransform,
      drawButtons,
      drawTexts,
      handleInput,
      handleButtons,
      handleTimers,
      move,
    );
    mouse.justReleased = false;
    requestAnimationFrame(update);
  })();
}
