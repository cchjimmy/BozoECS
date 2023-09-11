import {
  createComponent,
  createEntity,
  createSystem,
  createWorld,
  update,
  filter,
  removeEntity,
  getComponents,
  addComponents,
} from "../dist/main.es.js";

!function main() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);
  resize();
  window.onresize = resize;
  const Vec2 = { x: 0, y: 0 };
  const Position = createComponent(Vec2);
  const Velocity = createComponent(Vec2);
  const world = createWorld();
  const Movement = createSystem((world, dt) => {
    filter(world, [Position, Velocity], e => {
      var [p, v] = getComponents(world, e, [Position, Velocity])
      p.x += v.x * dt;
      p.y += v.y * dt;
    })
  })
  const Render = createSystem((world) => {
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    filter(world, [Position], e => {
      var [p] = getComponents(world, e, [Position]);
      ctx.strokeRect(p.x + canvas.width * 0.5, -p.y + canvas.height * 0.5, 5, 5);
    });
  })
  const Bounce = createSystem(world => {
    let hw = canvas.width * 0.5;
    let hh = canvas.height * 0.5;
    filter(world, [Position, Velocity], e => {
      var [p, v] = getComponents(world, e, [Position, Velocity]);
      if (p.x ** 2 > hw ** 2) {
        v.x *= -1;
        p.x = p.x > 0 ? hw : -hw;
      }
      if (p.y ** 2 > hh ** 2) {
        v.y *= -1;
        p.y = p.y > 0 ? hh : -hh;
      }
    })
  })

  function addEntity() {
    let e = createEntity();
    var [p, v] = addComponents(world, e, [Position, Velocity]);
    var maxSpeed = 100;
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

  var systems = [
    Render,
    Movement,
    Bounce
  ]

  let past = performance.now();

  run();

  function random(min = 0, max = 1) {
    return Math.random() * (max - min) + min;
  }

  function run() {
    let dt = performance.now() - past;
    past += dt;

    update(systems, world, dt * 0.001);

    requestAnimationFrame(run);
  }

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.strokeStyle = "green";
  }
}()
