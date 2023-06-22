import BozoECS from "../BozoECS.js";
import { position, velocity, appearance, playerTag } from "../components.js";
import { random } from "../helper.js";

const container = document.createElement("div");

const fps = document.createElement("span");

container.innerText = "FPS: ";
container.appendChild(fps);

document.body.appendChild(container);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 400;

document.body.appendChild(canvas);

const movement = BozoECS.createSystem(world => {
  BozoECS.forEach(world, [position, velocity], (p, v) => {
    p.x += v.x * dt;
    p.y += v.y * dt;
  })
})

const bounce = BozoECS.createSystem(world => {
  BozoECS.forEach(world, [position, velocity], (p, v) => {
    let futureX = p.x + v.x * dt;
    if (futureX < 0 || futureX > canvas.width) {
      v.x *= -1;
      p.x = v.x < 0 ? canvas.width : 0;
    }
    let futureY = p.y + v.y * dt;
    if (futureY < 0 || futureY > canvas.height) {
      v.y *= -1;
      p.y = v.y < 0 ? canvas.height : 0;
    }
  })
})

const render = BozoECS.createSystem(world => {
  let [cameraPos] = BozoECS.getComponentLists(world, [position, playerTag]);

  cameraPos = cameraPos[0];

  // background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // border
  ctx.strokeRect(canvas.width * 0.5 - cameraPos.x - appearance.properties.radius, canvas.height * 0.5 - cameraPos.y - appearance.properties.radius, canvas.width + appearance.properties.radius * 2, canvas.height + appearance.properties.radius * 2);

  BozoECS.forEach(world, [position, appearance], (p, a) => {
    ctx.strokeStyle = a.color;
    ctx.beginPath();
    ctx.arc(p.x - cameraPos.x + canvas.width * 0.5, p.y - cameraPos.y + canvas.height * 0.5, a.radius, 0, 2 * Math.PI);
    ctx.stroke();
  })
})

let base = BozoECS.createEntity();

BozoECS.addComponents(base, [position, velocity, appearance]);

let entities = new Array(100);
let maxSpeed = 100;
for (let i = 0; i < entities.length; i++) {
  let instance = BozoECS.instantiate(base);

  entities[i] = instance;

  let [p, v, a] = BozoECS.getComponents(instance, [position, velocity, appearance]);

  p.x = random(0, canvas.width);
  p.y = random(0, canvas.height);

  v.x = random(-maxSpeed, maxSpeed);
  v.y = random(-maxSpeed, maxSpeed);

  a.color = "green";
}

BozoECS.addComponents(entities[0], [playerTag]);

BozoECS.getComponents(entities[0], [appearance])[0].color = "white";

let systems = [render, bounce, movement];

const w = BozoECS.createWorld(entities, systems);

let dt = 0;
let past = performance.now();
function update() {
  BozoECS.update(w);
  dt = performance.now() - past;
  past += dt;
  dt /= 1000;
  fps.innerText = parseInt(1 / dt);
  requestAnimationFrame(update);
}

update();