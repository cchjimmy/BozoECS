import {
  createComponent,
  createEntity,
  createWorld,
  getComponents,
  addComponents,
  createSystem,
  createFilter,
  registerComponents,
} from "../dist/main.es.js";

!(function main() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);
  resize();
  window.onresize = resize;
  const Vec2 = { x: 0, y: 0 };
  const Position = createComponent(Vec2);
  const Velocity = createComponent(Vec2);
  const world = createWorld();
  registerComponents(world, [Position, Velocity]);

  function getComps([world, e]) {
    return getComponents(world, e, [Position, Velocity]);
  }
  function Move([p, v]) {
    p.x += v.x;
    p.y += v.y;
    return arguments[0];
  }
  function Render([p, v]) {
    ctx.strokeRect(p.x + canvas.width * 0.5, -p.y + canvas.height * 0.5, 5, 5);
    return arguments[0];
  }
  function Bounce([p, v]) {
    let hw = 200;
    let hh = 200;
    if (p.x ** 2 > hw ** 2) {
      v.x *= -1;
      p.x = p.x > 0 ? hw : -hw;
    }
    if (p.y ** 2 > hh ** 2) {
      v.y *= -1;
      p.y = p.y > 0 ? hh : -hh;
    }
    return arguments[0];
  }

  const filter = createFilter(Position, Velocity);

  const mainChain = [getComps, Render, Move, Bounce];

  const mainSystem = createSystem(filter)(...mainChain);

  function addEntity() {
    let e = createEntity();
    var [p, v] = addComponents(world, e, [Position, Velocity]);
    var maxSpeed = 1;
    v.x = random(-maxSpeed, maxSpeed);
    v.y = random(-maxSpeed, maxSpeed);
    let hw = canvas.width * 0.5;
    let hh = canvas.height * 0.5;
    p.x = random(-hw, hw);
    p.y = random(-hh, hh);
  }

  for (let i = 0; i < 10000; i++) {
    addEntity();
  }

  let past = performance.now();

  run();

  function random(min = 0, max = 1) {
    return Math.random() * (max - min) + min;
  }

  function run() {
    let dt = performance.now() - past;
    past += dt;
    dt *= 0.001;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    mainSystem(world);

    requestAnimationFrame(run);
  }

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.strokeStyle = "green";
  }
})();
