import BozoECS from "../BozoECS.js";
import { random } from "../helper.js";
import { position, velocity, appearance, ctx2d } from "../definitions/components.js";
import { render, movement, bounce } from "../definitions/systems.js";
import { base, ctx } from "../definitions/entities.js";

const container = document.createElement("div");
const fps = document.createElement("span");
container.innerText = "FPS: ";
container.appendChild(fps);
document.body.appendChild(container);

let [c] = BozoECS.getComponents(ctx, [ctx2d]);

document.body.appendChild(c.canvas);

c.canvas.width = 400;
c.canvas.height = 400;

let entities = new Array(100);
let maxSpeed = 100;
for (let i = 0; i < entities.length; i++) {
  let instance = BozoECS.instantiate(base);

  let [p, v, a] = BozoECS.getComponents(instance, [position, velocity, appearance]);

  p.x = random(0, c.canvas.width);
  p.y = random(0, c.canvas.height);

  v.x = random(-maxSpeed, maxSpeed);
  v.y = random(-maxSpeed, maxSpeed);

  a.color = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
  a.radius = random(5, 20);

  entities[i] = instance;
}

let systems = [render, movement, bounce];
  
let world = BozoECS.createWorld(entities, systems);

BozoECS.addEntities(world, [ctx]);

let past = performance.now();
let dt = 0;

requestAnimationFrame(update);

function update() {
  BozoECS.update(world, dt);
  dt = performance.now() - past;
  past += dt;
  dt /= 1000;
  fps.innerText = parseInt(1 / dt);
  requestAnimationFrame(update);
}