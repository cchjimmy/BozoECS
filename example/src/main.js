import {
  addComponent,
  component,
  entity,
  filter,
  getComponent,
  getEntityPointer,
  getResults,
  removeComponent,
  systemGroup,
  world,
} from "../../build/main.mjs";

function random(min, max) {
  return Math.random() * (max - min) + min;
}
function update(world, baseGroup, past) {
  const now = performance.now();
  baseGroup(world, (now - past) * 0.001);
  requestAnimationFrame(() => update(world, baseGroup, now));
}
function main() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  const ENTITY_COUNT = 1;

  function fullsrn() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }

  fullsrn();

  window.onresize = fullsrn;
  document.body.style.margin = "0px";
  document.body.style.userSelect = "none";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  // components
  const Vec2 = {
    x: 0,
    y: 0,
  };
  const Position = component(Vec2);
  const Velocity = component(Vec2);
  const Circle = component({
    radius: 10,
    color: "green",
  });

  // filters
  const f = filter(Position, Velocity, Circle);

  // systems
  function render(world, dt) {
    const twoPI = 2 * Math.PI;
    const entities = getResults(world, f);
    ctx.lineWidth = 3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    entities.forEach((e) => {
      const ptr = getEntityPointer(world, e);
      const p = getComponent(world, ptr, Position);
      const c = getComponent(world, ptr, Circle);
      ctx.strokeStyle = c.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, c.radius, 0, twoPI);
      ctx.stroke();
    });
  }
  function move(world, dt) {
    const entities = getResults(world, f);
    entities.forEach((e) => {
      const ptr = getEntityPointer(world, e);
      const p = getComponent(world, ptr, Position);
      const v = getComponent(world, ptr, Velocity);
      p.x += v.x * dt;
      p.y += v.y * dt;
    });
  }
  function bounce(world) {
    const entities = getResults(world, f);
    entities.forEach((e) => {
      const ptr = getEntityPointer(world, e);
      const p = getComponent(world, ptr, Position);
      const v = getComponent(world, ptr, Velocity);
      const c = getComponent(world, ptr, Circle);
      if (p.x - c.radius < 0 || p.x + c.radius > canvas.width) {
        v.x *= -1;
        p.x = p.x < canvas.width * 0.5 ? c.radius : canvas.width - c.radius;
      }
      if (p.y - c.radius < 0 || p.y + c.radius > canvas.height) {
        v.y *= -1;
        p.y = p.y < canvas.height * 0.5 ? c.radius : canvas.height - c.radius;
      }
    });
  }

  // world
  const w = world(Position, Velocity, Circle)(f);

  const baseGroup = systemGroup(render, move, bounce);

  // entity
  function createEntity() {
    const e = entity();
    const p = addComponent(w, e, Position);
    const v = addComponent(w, e, Velocity);
    const c = addComponent(w, e, Circle);
    const maxSpeed = 100;
    p.x = random(0, canvas.width);
    p.y = random(0, canvas.height);
    v.x = random(-maxSpeed, maxSpeed);
    v.y = random(-maxSpeed, maxSpeed);
    c.radius = random(10, 30);
    c.color = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
    return e;
  }

  for (let i = 0; i < ENTITY_COUNT; ++i) {
    createEntity();
  }

  const test = createEntity();

  removeComponent(w, test, Circle);

  update(w, baseGroup, performance.now());

  console.log(w);
}
main();
