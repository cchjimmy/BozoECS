import { World } from "../../../src/index.ts";
import { Application, Container, Graphics, Text } from "npm:pixi.js";

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

(async () => {
  const app = new Application();
  await app.init({ resizeTo: window });
  document.body.appendChild(app.canvas);

  const ENTITY_COUNT = 1000;

  const w = new World();

  // components
  const Position = { x: 0, y: 0 };
  const Velocity = { x: 0, y: 0 };
  const Circle = { radius: 10, color: "green", graphics: new Graphics() };

  // not necessary
  World
    .registerComponent(Position)
    .registerComponent(Velocity)
    .registerComponent(Circle);

  // systems
  function render(world: World) {
    world.query({ and: [Position, Circle] }).forEach((e) => {
      const p = World.getComponent(e, Position);
      const c = World.getComponent(e, Circle);
      c.graphics.x = p.x;
      c.graphics.y = p.y;
      c.graphics.scale = c.radius;
      c.graphics.tint = c.color;
    });
  }
  function move(world: World) {
    const dt = world.dtMilli / 1000;
    world.query({ and: [Position, Velocity] }).forEach((e) => {
      const p = World.getComponent(e, Position);
      const v = World.getComponent(e, Velocity);
      p.x += v.x * dt;
      p.y += v.y * dt;
    });
  }
  function bounce(world: World) {
    world.query({ and: [Position, Velocity, Circle] }).forEach((e) => {
      const p = World.getComponent(e, Position);
      const v = World.getComponent(e, Velocity);
      const c = World.getComponent(e, Circle);
      if (p.x - c.radius < 0 || p.x + c.radius > innerWidth) {
        v.x *= -1;
        p.x = p.x < innerWidth * 0.5 ? c.radius : innerWidth - c.radius;
      }
      if (p.y - c.radius < 0 || p.y + c.radius > innerHeight) {
        v.y *= -1;
        p.y = p.y < innerHeight * 0.5 ? c.radius : innerHeight - c.radius;
      }
    });
  }

  // entity
  const circles = new Container();
  app.stage.addChild(circles);
  function createEntity() {
    const e = w.addEntity();
    World.addComponent(e, Position, {
      x: random(0, innerWidth),
      y: random(0, innerHeight),
    });
    const maxSpeed = 100;
    World.addComponent(e, Velocity, {
      x: random(-maxSpeed, maxSpeed),
      y: random(-maxSpeed, maxSpeed),
    });
    const c = World.addComponent(e, Circle, {
      radius: random(10, 30),
      color: `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`,
      graphics: new Graphics().circle(0, 0, 1).stroke({
        color: "white",
        width: 0.1,
      }),
    });
    circles.addChild(c.graphics);
    return e;
  }

  for (let i = 0; i < ENTITY_COUNT; ++i) {
    createEntity();
  }

  const text = new Text();
  text.style = { fill: "white" };
  app.stage.addChild(text);

  app.ticker.add(() => {
    w.update(
      render,
      move,
      bounce,
    );
    text.text = `FPS: ${(1000 / w.dtMilli).toFixed(0)}`;
  });
})();
