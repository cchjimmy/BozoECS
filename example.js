import BozoECS from "./BozoECS.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const fps = document.querySelector("span");

canvas.width = innerWidth;
canvas.height = innerHeight;

document.body.appendChild(canvas);

let position = BozoECS.createComponent("position", {
  x: 0,
  y: 0
});

let velocity = BozoECS.createComponent("velocity", {
  x: 0,
  y: 0
});

let appearance = BozoECS.createComponent("appearance", {
  color: "black",
  radius: 10
})

let movement = BozoECS.createSystem((world) => {
  world.entities.forEach(entity => {
    let p = BozoECS.getComponent(entity, position);
    let v = BozoECS.getComponent(entity, velocity);
    p.x += v.x * world.deltaTime / 1000;
    p.y += v.y * world.deltaTime / 1000;
    if (p.x > canvas.width || p.x < 0) p.x = random(0, canvas.width);
    if (p.y > canvas.height || p.y < 0) p.y = random(0, canvas.height);
  })
});

let render = BozoECS.createSystem((world) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  world.entities.forEach(entity => {
    let p = BozoECS.getComponent(entity, position);
    let c = BozoECS.getComponent(entity, appearance);
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, c.radius, 0, Math.PI * 2);
    ctx.fill();
  })
})

let updateFPS = BozoECS.createSystem((world) => {
  fps.innerText = (1 / (world.deltaTime / 1000)).toFixed(0);
})

let w = BozoECS.createWorld([render, movement, updateFPS], () => {
  let entities = BozoECS.createEntities(600);
  for (let i = 0; i < entities.length; i++) {
    BozoECS.addComponent(entities[i], position);
    BozoECS.addComponent(entities[i], velocity);
    BozoECS.addComponent(entities[i], appearance);

    let v = BozoECS.getComponent(entities[i], velocity);
    let p = BozoECS.getComponent(entities[i], position);
    let c = BozoECS.getComponent(entities[i], appearance);

    v.x = random(-100, 100);
    v.y = random(-100, 100);

    p.x = random(0, canvas.width);
    p.y = random(0, canvas.height);

    c.color = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
    c.radius = random(10, 80);
  }
  return entities;
});

BozoECS.simulate(w);

//BozoECS.pause(w);

function random(min, max) {
  return Math.random() * (max - min) + min;
}