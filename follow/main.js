import BozoECS from "../BozoECS.js";
import { position, velocity, appearance, playerTag, ctx2d } from "../definitions/components.js";
import { random } from "../helper.js";
import { movement, bounce, followRender } from "../definitions/systems.js";
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

  entities[i] = instance;

  let [p, v, a] = BozoECS.getComponents(instance, [position, velocity, appearance]);

  p.x = random(0, c.canvas.width);
  p.y = random(0, c.canvas.height);

  v.x = random(-maxSpeed, maxSpeed);
  v.y = random(-maxSpeed, maxSpeed);

  a.color = "green";
}

BozoECS.addComponents(entities[0], [playerTag]);

BozoECS.getComponents(entities[0], [appearance])[0].color = "white";

let systems = [followRender, bounce, movement];

const w = BozoECS.createWorld(entities, systems);

BozoECS.addEntities(w, [ctx]);

let dt = 0;
let past = performance.now();
function update() {
  BozoECS.update(w, dt);
  dt = performance.now() - past;
  past += dt;
  dt /= 1000;
  fps.innerText = parseInt(1 / dt);
  requestAnimationFrame(update);
}

update();