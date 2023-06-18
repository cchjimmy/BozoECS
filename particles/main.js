import BozoECS from "../BozoECS.js";
import { random } from "../helper.js";
import { time, position, velocity, acceleration, spawn, appearance } from "../components.js";

const container = document.createElement("div");

container.innerText = "FPS: ";

const fps = document.createElement("span");
container.appendChild(fps);
document.body.appendChild(container);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 400;
document.body.appendChild(canvas);

const movement = BozoECS.createSystem(world => {
  BozoECS.forEach(world, [spawn, position, velocity, acceleration, time], (s, p, v, a, t) => {
    p.x = s.x + v.x * t.value + 0.5 * a.x * t.value ** 2;
    p.y = s.y + v.y * t.value + 0.5 * a.y * t.value ** 2;
    t.value += dt;
  })
});

const randomize = BozoECS.createSystem(world => {
  BozoECS.forEach(world, [spawn, position, time], (s, p, t) => {
    if (p.x > canvas.width || p.x < 0 || p.y > canvas.height || p.y < 0) {
      s.x = random(0, canvas.width);
      s.y = random(0, canvas.height);
      t.value = 0;
    }
  })
})

const render = BozoECS.createSystem(world => {
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  BozoECS.forEach(world, [position, appearance], (p, a) => {
    ctx.strokeStyle = a.color;
    ctx.beginPath();
    ctx.arc(p.x, canvas.height - p.y, a.radius, 0, Math.PI * 2);
    ctx.stroke();
  })
})

let baseEntity = BozoECS.createEntity();

BozoECS.addComponents(baseEntity, [spawn, position, velocity, acceleration, time, appearance]);

let maxSpeed = 200;

let entities = new Array(600);
for (let i = 0; i < entities.length; i++) {
  let instance = BozoECS.instantiate(baseEntity);

  let [v, a] = BozoECS.getComponents(instance, [velocity, appearance]);

  v.x = random(-maxSpeed, maxSpeed);
  v.y = random(-maxSpeed, maxSpeed);

  a.color = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
  a.radius = random(5, 20);

  entities[i] = instance;
}

let systems = [render, movement, randomize];
  
let world = BozoECS.createWorld(entities, systems);

let test = entities[0];

let [a] = BozoECS.getComponents(test, [appearance]);

a.color = "white";

BozoECS.addEntities(world, [test]);

let past = performance.now();
let dt = 0;

requestAnimationFrame(update);

function update() {
  BozoECS.update(world);
  dt = performance.now() - past;
  past += dt;
  dt /= 1000;
  fps.innerText = parseInt(1 / dt);
  requestAnimationFrame(update);
}