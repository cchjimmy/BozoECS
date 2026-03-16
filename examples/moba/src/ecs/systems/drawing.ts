import App from "../../app/app.ts";
import { World } from "bozoecs";
import {
  Rect,
  Graphic,
  OnScreen,
  Transform,
  Circle,
  Color,
  Health,
  Text,
  QtRect,
  QtCircle,
  Camera,
  ParticleEmitter,
  PathFinder,
} from "../components.ts";

export function drawCircles(world: World) {
  for (const e of world.query({ and: [OnScreen, Transform, Circle, Color] })) {
    const t = world.getComponent(e, Transform);
    const c = world.getComponent(e, Circle);
    const color = world.getComponent(e, Color);
    App.ctx.transform(t.scaleX, 0, 0, t.scaleY, t.x + c.x, t.y + c.y);
    App.ctx.beginPath();
    App.ctx.fillStyle = color.stroke;
    App.ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
    App.ctx.fill();
    App.ctx.beginPath();
    App.ctx.fillStyle = color.fill;
    App.ctx.arc(0, 0, c.radius - 0.5, 0, Math.PI * 2);
    App.ctx.fill();
    App.ctx.transform(
      1 / t.scaleX,
      0,
      0,
      1 / t.scaleY,
      -(t.x + c.x) / t.scaleX,
      -(t.y + c.y) / t.scaleY,
    );
  }
}

export function drawImg(world: World) {
  world.query({ and: [Graphic, Transform] }).forEach((e) => {
    const g = world.getComponent(e, Graphic);
    const p = world.getComponent(e, Transform);
    const img = g.image;
    let imgWidth = img.width;
    let imgHeight = img.height;
    let offsetX = 0;
    let offsetY = 0;
    if (world.hasComponent(e, Rect)) {
      const r = world.getComponent(e, Rect);
      imgWidth = r.width;
      imgHeight = r.height;
      offsetX = r.x;
      offsetY = r.y;
    }
    const scaleX = imgWidth / img.width;
    const scaleY = imgHeight / img.height;
    const c = Math.cos(p.rad);
    const s = Math.sin(p.rad);
    App.ctx.transform(
      c * scaleX,
      s * scaleX,
      -s * scaleY,
      c * scaleY,
      p.x,
      p.y,
    );
    App.ctx.drawImage(img, offsetX, offsetY);
    App.ctx.transform(
      c / scaleX,
      -s / scaleX,
      s / scaleY,
      c / scaleY,
      (c * -p.x + s * -p.y) / scaleY,
      (-s * -p.x + c * -p.y) / scaleY,
    );
  });
}

export function drawRects(world: World) {
  const rects = world.query({ and: [Transform, Rect, Color, OnScreen] });
  for (const e of rects) {
    const p = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const c = world.getComponent(e, Color);
    const cos = Math.cos(p.rad);
    const sin = Math.sin(p.rad);
    App.ctx.transform(cos, sin, -sin, cos, p.x, p.y);
    App.ctx.fillStyle = c.stroke;
    App.ctx.fillRect(
      r.x * p.scaleX,
      r.y * p.scaleY,
      r.width * p.scaleX,
      r.height * p.scaleY,
    );
    App.ctx.fillStyle = c.fill;
    App.ctx.fillRect(
      r.x * p.scaleX + 0.5,
      r.y * p.scaleY + 0.5,
      r.width * p.scaleX - 1,
      r.height * p.scaleY - 1,
    );
    App.ctx.transform(
      cos,
      -sin,
      sin,
      cos,
      cos * -p.x + sin * -p.y,
      -sin * -p.x + cos * -p.y,
    );
  }
}

export function drawHealthBars(world: World) {
  const widthMult = 1.5;
  const barHeight = 0.3;
  const margin = 0.2;
  const relativeBarY = -barHeight / 2 - 1;

  for (const e of world.query({ and: [OnScreen, Health, Transform, Rect] })) {
    const t = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const h = world.getComponent(e, Health);
    const cos = Math.cos(t.rad);
    const sin = Math.sin(t.rad);
    let x = -(r.width * widthMult) / 2;
    let y = relativeBarY + r.y;
    App.ctx.fillStyle = "black";
    App.ctx.fillRect(
      t.x - margin / 2 + cos * x - sin * y,
      t.y - margin / 2 + sin * x + cos * y,
      r.width * widthMult + margin,
      barHeight + margin,
    );
    x = -(r.width * widthMult) / 2;
    y = relativeBarY + r.y;
    App.ctx.fillStyle = "green";
    App.ctx.fillRect(
      t.x + cos * x - sin * y,
      t.y + sin * x + cos * y,
      r.width * widthMult * (h.current / h.max),
      barHeight,
    );
  }
  for (const e of world.query({ and: [OnScreen, Health, Transform, Circle] })) {
    const t = world.getComponent(e, Transform);
    const c = world.getComponent(e, Circle);
    const h = world.getComponent(e, Health);
    const cos = Math.cos(t.rad);
    const sin = Math.sin(t.rad);
    const x = -(c.radius * widthMult);
    const y = relativeBarY - 1;
    App.ctx.fillStyle = "black";
    App.ctx.fillRect(
      t.x - margin / 2 + cos * x - sin * y,
      t.y - margin / 2 + sin * x + cos * y,
      c.radius * 2 * widthMult + margin,
      barHeight + margin,
    );
    App.ctx.fillStyle = "green";
    App.ctx.fillRect(
      t.x + cos * x - sin * y,
      t.y + sin * x + cos * y,
      c.radius * 2 * widthMult * (h.current / h.max),
      barHeight,
    );
  }
}

export function drawTexts(world: World) {
  world.query({ and: [Text, Transform] }).forEach((e) => {
    const t = world.getComponent(e, Text);
    const p = world.getComponent(e, Transform);
    App.ctx.font = `${t.fontSize}px serif`;
    const lines = t.content.split("\n");
    App.ctx.fillStyle = t.backgroundColor;
    for (let i = 0, l = lines.length; i < l; i++) {
      const txtMetric = App.ctx.measureText(lines[i]);
      App.ctx.fillRect(
        p.x,
        p.y + i * (2 * t.padding) + i * txtMetric.fontBoundingBoxAscent,
        t.padding * 2 + txtMetric.width,
        t.padding * 2 + txtMetric.fontBoundingBoxAscent,
      );
    }
    App.ctx.fillStyle = t.color;
    for (let i = 0, l = lines.length; i < l; i++) {
      const txtMetric = App.ctx.measureText(lines[i]);
      App.ctx.fillText(
        lines[i],
        p.x + t.padding,
        p.y + i * (2 * t.padding) + (i + 1) * txtMetric.fontBoundingBoxAscent,
      );
    }
  });
}

export function drawQuadTree(world: World) {
  const qt = App.getQuadtree(App.getWorldId(world));
  qt.drawTree(App.ctx);
}

export function drawCameraRect(world: World) {
  App.ctx.strokeStyle = "red";
  App.ctx.lineWidth = 1;
  App.ctx.beginPath();
  for (const e of world.query({ and: [Transform, Camera] })) {
    const t = world.getComponent(e, Transform);
    const c = world.getComponent(e, Camera);
    App.ctx.rect(
      t.x - App.canvas.width / (c.zoom * 2),
      t.y - App.canvas.height / (c.zoom * 2),
      App.canvas.width / c.zoom,
      App.canvas.height / c.zoom,
    );
  }
  App.ctx.stroke();
}

export function drawParticleEmitters(world: World) {
  App.ctx.fillStyle = "green";
  App.ctx.beginPath();
  for (const e of world.query({ and: [ParticleEmitter, Transform] })) {
    const t = world.getComponent(e, Transform);
    App.ctx.moveTo(t.x, t.y);
    App.ctx.arc(t.x, t.y, 0.5, 0, Math.PI * 2);
  }
  App.ctx.fill();
}

export function drawPathFindTargets(world: World) {
  App.ctx.fillStyle = "blue";
  App.ctx.beginPath();
  for (const e of world.query({ and: [PathFinder] })) {
    const pf = world.getComponent(e, PathFinder);
    App.ctx.arc(pf.targetX, pf.targetY, 0.3, 0, Math.PI * 2);
  }
  App.ctx.fill();
}
