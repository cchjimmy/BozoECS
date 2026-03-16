import { World, entityT } from "bozoecs";
import {
  PathFinder,
  Camera,
  Button,
  Velocity,
  Stats,
  IsPlayer,
  Text,
  Graphic,
  Rect,
  ParticleEmitter,
  Timer,
  Callback,
  Transform,
  Color,
  Circle,
  Health,
  QtRect,
  QtCircle,
} from "./components.ts";
import { default as config } from "../../src/config.json" with { type: "json" };
import App from "../app/app.ts";

export function addCircle(
  world: World,
  x: number = 0,
  y: number = 0,
  radius: number = 1,
) {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Color);
  world.addComponent(e, Circle, { radius });
  return e;
}
export function addSpawners(world: World) {
  const base = addMinion(world, -152, 152);
  const pos = [-138, 109, -109, 138, -120, 120];
  for (let i = 0, l = pos.length; i < l; i += 2) {
    addSpawner(
      world,
      pos[i],
      pos[i + 1],
      base,
      config.entities.minion.spawnRate,
    );
    addSpawner(
      world,
      -pos[i],
      -pos[i + 1],
      base,
      config.entities.minion.spawnRate,
    );
  }
}
export function addMinion(world: World, x: number, y: number): entityT {
  const e = addCircle(world);
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Health, {
    current: config.entities.minion.healthPoint,
    max: config.entities.minion.healthPoint,
  });
  world.addComponent(e, Velocity);
  App.getQuadtree(App.getWorldId(world)).insert(
    world.addComponent(e, QtCircle),
  );
  return e;
}
export function addSpawner(
  world: World,
  x: number,
  y: number,
  spawnEntity: entityT,
  spawnRate: number = 1,
): entityT {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, ParticleEmitter, {
    particleLifetimeSeconds: 10,
    particleEntity: spawnEntity,
  });
  world.addComponent(e, Timer);
  world.addComponent(e, Callback, {
    fn(e) {
      const timer = world.getComponent(e, Timer);
      if (timer.timeSeconds < 1 / spawnRate) return;
      timer.reset = true;
      world.getComponent(e, ParticleEmitter).emit = true;
    },
  });
  return e;
}
export function addTurrents(world: World) {
  const pos = [
    -10, 10, -60, 60, -108, 108, -138, 92, -138, 0, -138, -110, -92, 138, 0,
    138, 110, 138,
  ];
  for (let i = 0, l = pos.length; i < l; i += 2) {
    addTurrent(world, pos[i], pos[i + 1]);
    addTurrent(world, -pos[i], -pos[i + 1]);
  }
}
export function addFountains(world: World) {
  const f1 = addCircle(world, -128, 128, 5);
  App.getQuadtree(App.getWorldId(world)).insert(
    world.addComponent(f1, QtCircle),
  );
  const f2 = addCircle(world, 128, -128, 5);
  App.getQuadtree(App.getWorldId(world)).insert(
    world.addComponent(f2, QtCircle),
  );
}
export function addGraphic(
  world: World,
  src: string,
  x = 0,
  y = 0,
  w = 1,
  h = 1,
) {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  const img = new Image();
  img.src = src;
  world.addComponent(e, Graphic, { image: img });
  world.addComponent(e, Rect, { width: w, height: h });
  return e;
}
export function addRect(
  world: World,
  x = 0,
  y = 0,
  w = 1,
  h = 1,
  offsetX = -w / 2,
  offsetY = -h / 2,
) {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Rect, { width: w, height: h, x: offsetX, y: offsetY });
  world.addComponent(e, Color);
  return e;
}
export function addText(world: World, x: number, y: number, str: string = "") {
  const e = world.addEntity();
  world.addComponent(e, Transform, { x, y });
  world.addComponent(e, Text, { content: str, fontSize: 20 });
  return e;
}
export function addButton(
  world: World,
  x = 0,
  y = 0,
  w = 10,
  h = 10,
  cb = (e: entityT) => {
    const b = world.getComponent(e, Button);
    const c = world.getComponent(e, Color);
    c.fill = "grey";
    if (b.hovered) {
      c.fill = "lightgrey";
    }
    if (b.pressed) {
      c.fill = "red";
    }
    if (b.clicked) {
      c.fill = "green";
    }
  },
) {
  const e = addRect(world, x, y, w, h);
  world.addComponent(e, Button);
  world.addComponent(e, Color);
  world.addComponent(e, Callback, { fn: cb });
  world.addComponent(e, Text, {
    content: "Button",
    backgroundColor: "transparent",
    color: "white",
  });
  App.getQuadtree(App.getWorldId(world)).insert(world.addComponent(e, QtRect));
  return e;
}
export function addPlayer(world: World, x = 0, y = 0) {
  const player = addCircle(world, x, y, 1);
  world.addComponent(player, Velocity);
  world.addComponent(player, Stats, {
    ...config.entities.player,
  });
  world.addComponent(player, Health, {
    max: config.entities.player.healthPoint,
    current: config.entities.player.healthPoint,
  });
  world.addComponent(player, IsPlayer);
  App.getQuadtree(App.getWorldId(world)).insert(
    world.addComponent(player, QtCircle),
  );
  return player;
}
export function addTurrent(world: World, x: number, y: number) {
  const width = 3;
  const height = 8;
  const turrent = addRect(
    world,
    x,
    y,
    width,
    height,
    -width / 2,
    -height + width / 2,
  );
  world.addComponent(turrent, Stats, { ...config.entities.turrent });
  world.addComponent(turrent, Health, {
    max: config.entities.turrent.healthPoint,
    current: config.entities.turrent.healthPoint,
  });
  App.getQuadtree(App.getWorldId(world)).insert(
    world.addComponent(turrent, QtRect),
  );
  return turrent;
}
export function addCamera(world: World, x: number, y: number) {
  const cam = world.addEntity();
  world.addComponent(cam, Camera);
  world.addComponent(cam, Transform, { x, y });
  return cam;
}
