import { World } from "bozoecs";
import {
  OnScreen,
  ParticleEmitter,
  Timer,
  PathFinder,
  Velocity,
  Stats,
  Circle,
  Camera,
  Transform,
  Rect,
  Callback,
  QtRect,
  QtCircle,
  Color,
} from "../components.ts";
import App from "../../app/app.ts";
import { isCircle, isRect } from "../../quadtree/shapes.ts";

export function handleCallbacks(world: World) {
  for (const e of world.query({ and: [Callback] })) {
    world.getComponent(e, Callback).fn(e);
  }
}

export function checkOnScreenEntities(world: World) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (camEntity == undefined) return;
  const cam = world.getComponent(camEntity, Camera);
  const camTransform = world.getComponent(camEntity, Transform);
  for (const e of world.query({ and: [OnScreen] })) {
    world.removeComponent(e, OnScreen);
  }
  const qtree = App.getQuadtree(App.getWorldId(world));
  for (const shape of qtree.query({
    x: camTransform.x - App.canvas.width / (cam.zoom * 2),
    y: camTransform.y - App.canvas.height / (cam.zoom * 2),
    width: App.canvas.width / cam.zoom,
    height: App.canvas.height / cam.zoom,
  })) {
    const s = shape as typeof QtRect | typeof QtCircle;
    world.addComponent(s.owner, OnScreen);
  }
}

export function handleParticleEmitters(world: World) {
  world.query({ and: [ParticleEmitter, Transform] }).forEach((e) => {
    const emitter = world.getComponent(e, ParticleEmitter);
    if (!emitter.emit) return;
    emitter.emit = false;
    const particle = world.copyEntity(emitter.particleEntity);
    world.addComponent(particle, Transform, world.getComponent(e, Transform));
    const timer = world.addComponent(particle, Timer);
    world.addComponent(particle, Callback).fn = () => {
      if (timer.timeSeconds < emitter.particleLifetimeSeconds) {
        emitter.particleTransition(
          world,
          particle,
          timer.timeSeconds / emitter.particleLifetimeSeconds,
        );
        return;
      }
      world.deleteEntity(particle);
    };
  });
}

export function handlePathfind(world: World) {
  world
    .query({ and: [PathFinder, Transform, Velocity, Stats] })
    .forEach((e) => {
      const pf = world.getComponent(e, PathFinder);
      const p = world.getComponent(e, Transform);
      const v = world.getComponent(e, Velocity);
      const s = world.getComponent(e, Stats);

      const dx = pf.targetX - p.x;
      const dy = pf.targetY - p.y;
      const dMag = (dx * dx + dy * dy) ** 0.5;
      const distancePerSec = s.moveSpeed * App.time.dtSeconds;
      if (dMag < distancePerSec) {
        world.removeComponent(e, PathFinder);
        v.x = v.y = 0;
        return;
      }
      const adjustedSpeed =
        s.moveSpeed *
        (dMag > distancePerSec * 5 ? 1 : 1 / (distancePerSec * 5));
      v.x = (dx / dMag) * adjustedSpeed;
      v.y = (dy / dMag) * adjustedSpeed;
    });
}
export function handleTimers(world: World) {
  world.query({ and: [Timer] }).forEach((e) => {
    const t = world.getComponent(e, Timer);
    if (t.reset) t.timeSeconds = 0;
    t.reset = false;
    if (!t.pause) t.timeSeconds += App.time.dtSeconds;
  });
}
export function handleCamera(world: World) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (!camEntity) return;
  const c = world.getComponent(camEntity, Camera);
  const p = world.getComponent(camEntity, Transform);
  if (c.targetEntity != -1 && world.hasComponent(c.targetEntity, Transform)) {
    const targetPos = world.getComponent(c.targetEntity, Transform);
    Object.assign(p, targetPos);
  }
  const sin = Math.sin(c.tilt) * c.zoom;
  const cos = Math.cos(c.tilt) * c.zoom;
  App.ctx.setTransform(
    cos,
    sin,
    -sin,
    cos,
    cos * -p.x - sin * -p.y + App.ctx.canvas.width * 0.5,
    sin * -p.x + cos * -p.y + App.ctx.canvas.height * 0.5,
  );
}
export function handleMovement(world: World) {
  world.query({ and: [Transform, Velocity] }).forEach((e) => {
    const p = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    p.x += v.x * App.time.dtSeconds;
    p.y += v.y * App.time.dtSeconds;
  });
}

export function handleQuadtreeElms(world: World) {
  const qtree = App.getQuadtree(App.getWorldId(world));
  for (const e of world.query({ and: [QtRect, Rect, Transform] })) {
    const r = world.getComponent(e, Rect);
    const qr = world.getComponent(e, QtRect);
    const t = world.getComponent(e, Transform);
    qr.x = t.x + r.x;
    qr.y = t.y + r.y;
    qr.width = r.width * t.scaleX;
    qr.height = r.height * t.scaleY;
    qr.owner = e;
  }
  for (const e of world.query({ and: [QtCircle, Circle, Transform] })) {
    const c = world.getComponent(e, Circle);
    const qc = world.getComponent(e, QtCircle);
    const t = world.getComponent(e, Transform);
    qc.x = t.x + c.x;
    qc.y = t.y + c.y;
    qc.radius = c.radius * t.scaleX;
    qc.owner = e;
  }
  qtree.update();
}

export function handleCollision(world: World) {
  const qtree = App.getQuadtree(App.getWorldId(world));

  for (const e of world.query({ and: [QtRect, Transform, Velocity] })) {
    const qr = world.getComponent(e, QtRect);
    const t = world.getComponent(e, Transform);
    for (const other of qtree.query(qr)) {
      const o = other as typeof QtCircle | typeof QtRect;
      if (o.owner == e) continue;

      // rect - circle interaction is handled in circles' loop

      if (isRect(o)) {
        const dx = t.x + qr.width / 2 - (o.x + o.width / 2);
        const dy = t.y + qr.height / 2 - (o.y + o.height / 2);
        if (
          (qr.width + o.width) / 2 - Math.abs(dx) <
          (qr.height + o.height) / 2 - Math.abs(dy)
        ) {
          t.x += (dx / Math.abs(dx)) * (qr.width + o.width - Math.abs(dx));
        } else {
          t.y +=
            (dy / Math.abs(dy)) * ((qr.height + o.height) / 2 - Math.abs(dy));
        }
      }
    }
  }
  for (const e of world.query({ and: [QtCircle, Transform, Velocity] })) {
    const qc = world.getComponent(e, QtCircle);
    const t = world.getComponent(e, Transform);
    for (const other of qtree.query(qc)) {
      const o = other as typeof QtCircle | typeof QtRect;
      if (o.owner == e) continue;
      if (isCircle(o)) {
        const dx = t.x - o.x;
        const dy = t.y - o.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag == 0) continue;
        t.x += (dx / mag) * (qc.radius + o.radius - mag);
        t.y += (dy / mag) * (qc.radius + o.radius - mag);
      } else if (isRect(o)) {
        const dx = t.x - (o.x + o.width / 2);
        const dy = t.y - (o.y + o.height / 2);
        if (
          qc.radius + o.width / 2 - Math.abs(dx) <
          qc.radius + o.height / 2 - Math.abs(dy)
        ) {
          t.x += (dx / Math.abs(dx)) * (qc.radius + o.width / 2 - Math.abs(dx));
        } else {
          t.y +=
            (dy / Math.abs(dy)) * (qc.radius + o.height / 2 - Math.abs(dy));
        }
      }
    }
  }
}
