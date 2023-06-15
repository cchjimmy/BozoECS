import BozoECS from "../BozoECS.js";
import { random } from "../helper.js";

const container = document.createElement("div");

container.innerText = "FPS: ";

const fps = document.createElement("span");
container.appendChild(fps);
document.body.appendChild(container);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;
document.body.appendChild(canvas);

const position = BozoECS.createComponent({
  x: 0,
  y: 0
});

const velocity = BozoECS.createComponent({
  x: 0,
  y: 0
});

const acceleration = BozoECS.createComponent({
  x: 0,
  y: -981
})

const appearance = BozoECS.createComponent({
  color: "black",
  radius: 10
})

const time = BozoECS.createComponent({
  value: 0
})

const spawn = BozoECS.createComponent({
  x: 0,
  y: 0
})

const movement = BozoECS.createSystem(world => {
  BozoECS.forEach(world, [spawn, position, velocity, acceleration, time], (s, p, v, a, t) => {
    t.value += dt;
    p.x = s.x + v.x * t.value + 0.5 * a.x * t.value ** 2;
    p.y = s.y + v.y * t.value + 0.5 * a.y * t.value ** 2;
    if (p.x > canvas.width || p.x < 0) {
      s.x = random(0, canvas.width);
      t.value = 0;
    }
    if (p.y > canvas.height || p.y < 0) {
      s.y = random(0, canvas.height);
      t.value = 0;
    }
  })
});

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

  let [s, v, a] = BozoECS.getComponents(instance, [spawn, velocity, appearance]);

  s.x = random(0, canvas.width);
  s.y = random(0, canvas.height);

  v.x = random(-maxSpeed, maxSpeed);
  v.y = random(-maxSpeed, maxSpeed);

  a.color = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
  a.radius = random(10, 50);

  entities[i] = instance;
}

let systems = [render, movement];
  
let world = BozoECS.createWorld(entities, systems);

let main = entities[0];

let [a] = BozoECS.getComponents(main, [appearance]);

a.color = "white";

BozoECS.addEntities(world, [main]);

let past = performance.now();
let dt = 0;

requestAnimationFrame(update);

function update() {
  fps.innerText = (1 / dt).toFixed(0);
  BozoECS.update(world);
  dt = performance.now() - past;
  past += dt;
  dt /= 1000;
  requestAnimationFrame(update);
}