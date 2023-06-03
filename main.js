import BozoECS from "./BozoECS.js";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const fps = document.querySelector("span");

let past = performance.now();
let dt = 0;

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
    let [p, v] = BozoECS.getComponents(entity, [position, velocity]);
    p.x += v.x * dt / 1000;
    p.y += v.y * dt / 1000;
    if (p.x > canvas.width || p.x < 0) p.x = random(0, canvas.width);
    if (p.y > canvas.height || p.y < 0) p.y = random(0, canvas.height);
  })
});

let render = BozoECS.createSystem((world) => {
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  world.entities.forEach(entity => {
    let [p, v, a] = BozoECS.getComponents(entity, [position, velocity, appearance])
    ctx.strokeStyle = a.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, a.radius, 0, Math.PI * 2);
    ctx.stroke();
  })
})

let entities = new Array(1000);
for (let i = 0; i < entities.length; i++) {
  let entity = BozoECS.createEntity();

  BozoECS.addComponents(entity, [position, velocity, appearance]);

  let [p, v, a] = BozoECS.getComponents(entity, [position, velocity, appearance]);

  p.x = random(0, canvas.width);
  p.y = random(0, canvas.height);

  v.x = random(-100, 100);
  v.y = random(-100, 100);

  a.color = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
  a.radius = random(10, 50);

  entities[i] = entity;
}
  
let w = BozoECS.createWorld(entities, [render, movement]);

update();

function update() {
  BozoECS.update(w);

  dt = performance.now() - past;
  past += dt;

  fps.innerText = (1 / (dt / 1000)).toFixed(0);
  
  requestAnimationFrame(update);
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}