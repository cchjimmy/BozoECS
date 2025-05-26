import { entityT, World } from "../../../src/index.ts";
import { default as config } from "./config.json" with { type: "json" };

const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext("2d");

// components
const Rect = {
  width: 1,
  height: 1,
  color: "white",
};
const Position = {
  x: 0,
  y: 0,
};
const Velocity = {
  x: 0,
  y: 0,
};
const Text = {
  content: "",
  fontSize: 20,
  padding: 3,
  color: "black",
  backgroundColor: "white",
};
const PlayerControl = {
  isLeft: true,
};

// world
const w = new World();

// systems
function handlePlayerControl(world: World) {
  world.query({ and: [Velocity, PlayerControl] }).forEach((e) => {
    const v = World.getComponent(e, Velocity);
    const pc = World.getComponent(e, PlayerControl);
    v.y = 0;
    if (pc.isLeft) {
      if (keys["w"]) {
        v.y -= 1;
      }
      if (keys["s"]) {
        v.y += 1;
      }
    } else {
      if (keys["ArrowUp"]) {
        v.y -= 1;
      }
      if (keys["ArrowDown"]) {
        v.y += 1;
      }
    }
    for (const pos of Object.values(touches)) {
      if (ctx) {
        const old = ctx.fillStyle;
        ctx.fillStyle = "green";
        ctx.fillRect(pos.x, pos.y, 20, 20);
        ctx.fillStyle = old;
      }
      if (pos.x < config.playArea.width * 0.5) {
        if (!pc.isLeft) continue;
      } else {
        if (pc.isLeft) continue;
      }
      if (pos.y < config.playArea.height * 0.5) {
        v.y -= 1;
      }
      if (pos.y > config.playArea.height * 0.5) {
        v.y += 1;
      }
    }
    v.y = v.y / Math.abs(v.y || 1) * config.paddle.speed;
  });
}

function drawBackgound() {
  if (!ctx || !canvas) return;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function move(world: World) {
  const dt = world.dtMilli / 1000;
  world.query({ and: [Position, Velocity] }).forEach((e) => {
    const p = World.getComponent(e, Position);
    const v = World.getComponent(e, Velocity);
    p.x += v.x * dt;
    p.y += v.y * dt;
  });
}

function drawRects(world: World) {
  if (!ctx) return;
  world.query({ and: [Rect, Position] }).forEach((e) => {
    const p = World.getComponent(e, Position);
    const r = World.getComponent(e, Rect);
    const old = ctx.fillStyle;
    ctx.fillStyle = r.color;
    ctx.fillRect(
      Math.floor(p.x - r.width * 0.5),
      Math.floor(p.y - r.height * 0.5),
      r.width,
      r.height,
    );
    ctx.fillStyle = old;
  });
}

function drawTexts(world: World) {
  if (!ctx) return;
  world.query({ and: [Text, Position] }).forEach((e) => {
    const t = World.getComponent(e, Text);
    const p = World.getComponent(e, Position);

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

function checkCollision(world: World) {
  const rects = world.query({ and: [Position, Rect] });
  rects.forEach((e) => {
    const p = World.getComponent(e, Position);
    const r = World.getComponent(e, Rect);
    rects.forEach((other) => {
      if (other == e) return;
      const p1 = World.getComponent(other, Position);
      const r1 = World.getComponent(other, Rect);
      if (
        (p.x - p1.x) ** 2 < ((r.width + r1.width) * 0.5) ** 2 &&
        (p.y - p1.y) ** 2 < ((r.height + r1.height) * 0.5) ** 2
      ) {
        onCollision(e, other);
      }
    });
  });
}

function checkGoal() {
  const p = World.getComponent(ball, Position);
  const r = World.getComponent(ball, Rect);
  if (p.x - r.width > config.playArea.width) {
    scores.left++;
    onGoal();
  }
  if (p.x + r.width < 0) {
    scores.right++;
    onGoal();
  }
}

// entity
function addPlayerPaddle(
  x: number,
  y: number,
  isLeft: boolean,
): entityT {
  const e = addRect(x, y, config.paddle.width, config.paddle.height);
  const pc = World.addComponent(e, PlayerControl);
  pc.isLeft = isLeft;
  return w.addEntity(e);
}

function addRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string = "white",
) {
  const e = World.createEntity();
  const p = World.addComponent(e, Position);
  const v = World.addComponent(e, Velocity);
  const r = World.addComponent(e, Rect);
  p.x = x;
  p.y = y;
  r.width = width;
  r.height = height;
  r.color = color;
  return w.addEntity(e);
}

function addText(
  txt: string,
  x: number = 0,
  y: number = 0,
  txtColor: string = "black",
  fontSize: number = 20,
  backgroundColor: string = "rgba(0,0,0,0)",
): entityT {
  const e = World.createEntity();
  const t = World.addComponent(e, Text);
  const p = World.addComponent(e, Position);
  t.content = txt;
  t.color = txtColor;
  t.fontSize = fontSize;
  t.backgroundColor = backgroundColor;
  p.x = x;
  p.y = y;
  return w.addEntity(e);
}

if (canvas) {
  canvas.width = config.playArea.width;
  canvas.height = config.playArea.height;
  //canvas.style.imageRendering = "pixelated";
}

const keys: Record<KeyboardEvent["key"], boolean> = {};
globalThis.onkeydown = (e) => {
  keys[e.key] = true;
};
globalThis.onkeyup = (e) => {
  delete keys[e.key];
};

// multi touch
const touches: Record<number, { x: number; y: number }> = {};
globalThis.window.ontouchmove = globalThis.window.ontouchstart = (e) => {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  for (let i = 0, l = e.changedTouches.length; i < l; i++) {
    const p = touches[e.changedTouches[i].identifier] = {
      x: e.changedTouches[i].clientX,
      y: e.changedTouches[i].clientY,
    };
    p.x -= rect.left;
    p.y -= rect.top;
    if (innerWidth / innerHeight < canvas.width / canvas.height) {
      p.x *= canvas.width / innerWidth;
      p.y *= canvas.width / innerWidth;
    } else {
      p.x *= canvas.height / innerHeight;
      p.y *= canvas.height / innerHeight;
    }
  }
};
globalThis.window.ontouchend = (e) => {
  for (let i = 0, l = e.changedTouches.length; i < l; i++) {
    delete touches[e.changedTouches[i].identifier];
  }
};

//bottom wall
addRect(
  config.playArea.width * 0.5,
  config.playArea.height * 0,
  config.playArea.width,
  10,
);
//top wall
addRect(
  config.playArea.width * 0.5,
  config.playArea.height * 1,
  config.playArea.width,
  10,
);

const ball = addRect(
  config.playArea.width * 0.5,
  config.playArea.height * 0.5,
  config.ball.width,
  config.ball.height,
);

const playerLeft = addPlayerPaddle(
  config.playArea.width * config.paddle.padding,
  config.playArea.height * 0.5,
  true,
);
const playerRight = addPlayerPaddle(
  config.playArea.width * (1 - config.paddle.padding),
  config.playArea.height * 0.5,
  false,
);

function reset() {
  const ballV = World.getComponent(ball, Velocity);
  const ballP = World.getComponent(ball, Position);
  ballP.x = config.playArea.width * 0.5;
  ballP.y = config.playArea.height * 0.5;
  ballV.x = config.ball.speed;
  ballV.y = 0;
  let rad = Math.random() * 40 / 180 * Math.PI;
  rad *= Math.random() > 0.5 ? 1 : -1;
  rad += Math.random() > 0.5 ? Math.PI : 0;
  rotate(ballV, rad);
  const pLP = World.getComponent(playerLeft, Position);
  const pRP = World.getComponent(playerRight, Position);
  pLP.y = config.playArea.height * 0.5;
  pRP.y = config.playArea.height * 0.5;
}

function rotate(vec2: { x: number; y: number }, rad: number) {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const x = vec2.x;
  const y = vec2.y;
  vec2.x = c * x - s * y;
  vec2.y = s * x + c * y;
}

function onGoal() {
  const t = World.getComponent(goalTexts, Text);
  t.content = `${scores.left} : ${scores.right}`;
  reset();
}

function onCollision(e: entityT, other: entityT) {
  const p = World.getComponent(e, Position);
  const p1 = World.getComponent(other, Position);
  const r = World.getComponent(e, Rect);
  const r1 = World.getComponent(other, Rect);
  const v = World.getComponent(e, Velocity);
  const v1 = World.getComponent(other, Velocity);

  const vMag = (v.x ** 2 + v.y ** 2) ** 0.5;
  const vNx = v.x / vMag, vNy = v.y / vMag;
  //p.x+vNx*t=someX,t=(someX-p.x)/vNx
  let t = 0;
  if (vNx != 0) {
    t = (p1.x - (r1.width + r.width) * 0.5 - p.x) / vNx;
    if (
      p.x < p1.x && t < 0 &&
      p.y + t * vNy < p1.y + (r1.height + r.height) * 0.5 &&
      p.y + t * vNy > p1.y - (r1.height + r.height) * 0.5
    ) {
      p.x += t * vNx;
      p.y += t * vNy;
      v.x > 0 && (v.x *= -1);
      v.y += v1.y;
    }
    t = (p1.x + (r1.width + r.width) * 0.5 - p.x) / vNx;
    if (
      p.x > p1.x && t < 0 &&
      p.y + t * vNy < p1.y + (r1.height + r.height) * 0.5 &&
      p.y + t * vNy > p1.y - (r1.height + r.height) * 0.5
    ) {
      p.x += t * vNx;
      p.y += t * vNy;
      v.x < 0 && (v.x *= -1);
      v.y += v1.y;
    }
  }
  if (vNy != 0) {
    t = (p1.y - (r1.height + r.height) * 0.5 - p.y) / vNy;
    if (
      p.y < p1.y && t < 0 &&
      p.x + t * vNx < p1.x + (r1.width + r.width) * 0.5 &&
      p.x + t * vNx > p1.x - (r1.width + r.width) * 0.5
    ) {
      p.x += t * vNx;
      p.y += t * vNy;
      v.y > 0 && (v.y *= -1);
    }
    t = (p1.y + (r1.height + r.height) * 0.5 - p.y) / vNy;
    if (
      p.y > p1.y && t < 0 &&
      p.x + t * vNx < p1.x + (r1.width + r.width) * 0.5 &&
      p.x + t * vNx > p1.x - (r1.width + r.width) * 0.5
    ) {
      p.x += t * vNx;
      p.y += t * vNy;
      v.y < 0 && (v.y *= -1);
    }
  }
}

const scores = { left: 0, right: 0 };

const goalTexts = addText(`${scores.left} : ${scores.right}`);
const t = World.getComponent(goalTexts, Text);
t.color = "white";
t.fontSize = 40;

reset();

(function update() {
  w.update(
    drawBackgound,
    drawRects,
    drawTexts,
    move,
    handlePlayerControl,
    checkCollision,
    checkGoal,
  );
  requestAnimationFrame(update);
})();
