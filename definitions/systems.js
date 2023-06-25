import BozoECS from "../BozoECS.js";
import { ctx2d, position, velocity, appearance, playerTag } from "./components.js";

export const render = BozoECS.createSystem(world => {
  const [c] = BozoECS.getComponentLists(world, [ctx2d])[0];

  const ctx = c.ctx;
  const canvas = c.canvas;

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  BozoECS.forEach(world, [position, appearance], (p, a) => {
    ctx.strokeStyle = a.color;
    ctx.beginPath();
    ctx.arc(p.x, canvas.height - p.y, a.radius, 0, Math.PI * 2);
    ctx.stroke();
  })
})

export const followRender = BozoECS.createSystem(world => {
  const [c] = BozoECS.getComponentLists(world, [ctx2d])[0];
  const [playerPos] = BozoECS.getComponentLists(world, [position, playerTag])[0];

  const ctx = c.ctx;
  const canvas = c.canvas;

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeRect(canvas.width * 0.5 - playerPos.x, - (canvas.height * 0.5 - playerPos.y), canvas.width, canvas.height);

  BozoECS.forEach(world, [position, appearance], (p, a) => {
    ctx.strokeStyle = a.color;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.5 - playerPos.x + p.x, canvas.height - (canvas.height * 0.5 - playerPos.y + p.y), a.radius, 0, Math.PI * 2);
    ctx.stroke();
  })
})

export const movement = BozoECS.createSystem((world, dt) => {
  BozoECS.forEach(world, [position, velocity], (p, v) => {
    p.x += v.x * dt;
    p.y += v.y * dt;
  })
})

export const bounce = BozoECS.createSystem((world, dt) => {
  const [c] = BozoECS.getComponentLists(world, [ctx2d])[0];

  const canvas = c.canvas;

  BozoECS.forEach(world, [position, velocity, appearance], (p, v, a) => {
    let futureX = p.x + v.x * dt;
    if (futureX - a.radius < 0 || futureX + a.radius > canvas.width) {
      v.x *= -1;
      p.x = v.x < 0 ? canvas.width - a.radius : a.radius;
    }
    let futureY = p.y + v.y * dt;
    if (futureY - a.radius < 0 || futureY + a.radius > canvas.height) {
      v.y *= -1;
      p.y = v.y < 0 ? canvas.height - a.radius : a.radius;
    }
  })
})