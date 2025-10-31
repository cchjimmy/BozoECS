import { World } from "bozoecs";

// singletons
const Ctx2D = setUpCanvas2D();
const Time = setUpTime();
const Pointer = setUpPointer();

function setUpCanvas2D() {
  const canvas =
    document.querySelector("canvas") ?? document.createElement("canvas");
  if (!canvas) throw new Error("Cannot create canvas element.");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot initialize context 2d.");

  document.body.appendChild(canvas);

  globalThis.onresize = globalThis.onload = () => {
    if (innerWidth / innerHeight < canvas.width / canvas.height) {
      canvas.style.width = "100%";
      canvas.style.height = "";
    } else {
      canvas.style.width = "";
      canvas.style.height = "100%";
    }
  };

  return { canvas, ctx };
}
function setUpTime() {
  return { dtMilli: 0, timeMilli: 0 };
}
function updateTime(time: { dtMilli: number; timeMilli: number }) {
  time.dtMilli = performance.now() - time.timeMilli;
  time.timeMilli += time.dtMilli;
}
function setUpPointer() {
  const pointer = {
    x: 0,
    y: 0,
    isDown: false,
    justPressed: false,
    justReleased: false,
    pressPos: { x: 0, y: 0 },
    releasePos: { x: 0, y: 0 },
  };

  globalThis.onpointerdown = (e) => {
    if (!(e.target instanceof HTMLCanvasElement)) return;
    ((pointer.x = e.x), (pointer.y = e.y));
    Object.assign(pointer.pressPos, pointer);
    pointer.isDown = pointer.justPressed = true;
  };

  globalThis.onpointerup = (e) => {
    ((pointer.x = e.x), (pointer.y = e.y));
    Object.assign(pointer.releasePos, pointer);
    ((pointer.isDown = false), (pointer.justReleased = true));
  };

  globalThis.onpointermove = (e) => {
    ((pointer.x = e.x), (pointer.y = e.y));
  };

  return pointer;
}
function updatePointer(
  pointer: Record<"justPressed" | "justReleased", boolean>,
) {
  pointer.justPressed = false;
  pointer.justReleased = false;
}
// components
const Transform = { x: 0, y: 0, rad: 0 };
const Hierarchy = { parent: -1 };
const Eye = { eyeWhiteRadius: 1, pupilRadius: 0.4, lookAtEntity: -1 };
const Camera = { zoom: 20, tilt: 0, isActive: false, targetEntity: -1 };
const Rect = { width: 1, height: 1, offsetX: -0.5, offsetY: -0.5 };
const Material = { density: 0.1 };
const Velocity = { x: 0, y: 0 };
const Acceleration = { x: 0, y: 0 };

// entities
function addLimb(
  world: World,
  x = 0,
  y = 0,
  w = 1,
  h = 1,
  parent = -1,
  offsetX = -w / 2,
  offsetY = 0,
) {
  const limb = world.addEntity();
  world.addComponent(limb, Transform, { x, y });
  world.addComponent(limb, Hierarchy, { parent });
  world.addComponent(limb, Rect, {
    width: w,
    height: h,
    offsetX,
    offsetY,
  });
  world.addComponent(limb, Material);
  world.addComponent(limb, Velocity);
  world.addComponent(limb, Acceleration);
  return limb;
}
function addEye(
  world: World,
  x = 0,
  y = 0,
  eyeWhiteRadius = 1,
  pupilRadius = 0.4,
  lookAtEntity = -1,
  parent = -1,
) {
  const eye = world.addEntity();
  world.addComponent(eye, Transform, { x, y });
  world.addComponent(eye, Hierarchy, { parent });
  world.addComponent(eye, Eye, { eyeWhiteRadius, pupilRadius, lookAtEntity });
  return eye;
}
function addPerson(world: World, x = 0, y = 0) {
  const torso = addLimb(world, x, y, 1, 2);
  const head = addLimb(world, 0, -0.2, 1, 1, torso, -0.5, -1);
  const leftEye = addEye(world, -0.4, -0.4, 0.3, 0.1, pointerRect, head);
  const right = addEye(world, 0.4, -0.4, 0.3, 0.1, pointerRect, head);
  const leftUpperArm = addLimb(world, -1, 0, 0.5, 1, torso);
  const leftLowerArm = addLimb(world, 0, 1, 0.5, 1, leftUpperArm);
  const rightUpperArm = addLimb(world, 1, 0, 0.5, 1, torso);
  const rightLowerArm = addLimb(world, 0, 1, 0.5, 1, rightUpperArm);
  const leftUpperLeg = addLimb(world, -0.5, 2, 0.5, 1, torso);
  const leftLowerLeg = addLimb(world, 0, 1, 0.5, 1, leftUpperLeg);
  const rightUpperLeg = addLimb(world, 0.5, 2, 0.5, 1, torso);
  const rightLowerLeg = addLimb(world, 0, 1, 0.5, 1, rightUpperLeg);
  return torso;
}

// systems
function handleDrawing(world: World) {
  Ctx2D.ctx.beginPath();
  world.query({ and: [Transform, Rect], not: [Hierarchy] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const r = world.getComponent(e, Rect);
    const c = Math.cos(t.rad);
    const s = Math.sin(t.rad);
    Ctx2D.ctx.transform(c, s, -s, c, t.x, t.y);
    Ctx2D.ctx.rect(r.offsetX, r.offsetY, r.width, r.height);
    Ctx2D.ctx.transform(c, -s, s, c, c * -t.x + s * -t.y, -s * -t.x + c * -t.y);
  });
  world.query({ and: [Transform, Rect, Hierarchy] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const rect = world.getComponent(e, Rect);
    let h = world.getComponent(e, Hierarchy);
    let x = t.x;
    let y = t.y;
    let r = t.rad;
    while (world.hasComponent(h.parent, Hierarchy)) {
      if (world.hasComponent(h.parent, Transform)) {
        const parentTransform = world.getComponent(h.parent, Transform);
        const c = Math.cos(parentTransform.rad);
        const s = Math.sin(parentTransform.rad);
        const _x = x;
        const _y = y;
        x = c * _x - s * _y;
        y = s * _x + c * _y;
        x += parentTransform.x;
        y += parentTransform.y;
        r += parentTransform.rad;
      }
      h = world.getComponent(h.parent, Hierarchy);
    }
    const c = Math.cos(r);
    const s = Math.sin(r);
    Ctx2D.ctx.transform(c, s, -s, c, x, y);
    Ctx2D.ctx.rect(rect.offsetX, rect.offsetY, rect.width, rect.height);
    Ctx2D.ctx.transform(c, -s, s, c, c * -x + s * -y, -s * -x + c * -y);
  });
  Ctx2D.ctx.fillStyle = "white";
  Ctx2D.ctx.fill();

  world.query({ and: [Transform, Eye, Hierarchy] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const eye = world.getComponent(e, Eye);
    let h = world.getComponent(e, Hierarchy);
    let x = t.x;
    let y = t.y;
    while (world.hasComponent(h.parent, Hierarchy)) {
      if (world.hasComponent(h.parent, Transform)) {
        const parentTransform = world.getComponent(h.parent, Transform);
        const c = Math.cos(parentTransform.rad);
        const s = Math.sin(parentTransform.rad);
        const _x = x;
        const _y = y;
        x = c * _x - s * _y;
        y = s * _x + c * _y;
        x += parentTransform.x;
        y += parentTransform.y;
      }
      h = world.getComponent(h.parent, Hierarchy);
    }
    Ctx2D.ctx.fillStyle = "lightgrey";
    Ctx2D.ctx.beginPath();
    Ctx2D.ctx.ellipse(
      x,
      y,
      eye.eyeWhiteRadius,
      eye.eyeWhiteRadius,
      0,
      0,
      Math.PI * 2,
    );
    Ctx2D.ctx.fill();
    let dirX = 0;
    let dirY = 0;
    let mag = eye.eyeWhiteRadius - eye.pupilRadius;
    if (eye.lookAtEntity != -1) {
      const t = world.getComponent(eye.lookAtEntity, Transform);
      dirX = t.x - x;
      dirY = t.y - y;
      const m = (dirX ** 2 + dirY ** 2) ** 0.5;
      dirX /= m;
      dirY /= m;
      mag = Math.min(m, mag);
    }
    Ctx2D.ctx.fillStyle = "black";
    Ctx2D.ctx.beginPath();
    Ctx2D.ctx.ellipse(
      x + dirX * mag,
      y + dirY * mag,
      eye.pupilRadius,
      eye.pupilRadius,
      0,
      0,
      Math.PI * 2,
    );
    Ctx2D.ctx.fill();
  });
}
function handleCamera(world: World) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (!camEntity) return;
  Ctx2D.ctx.resetTransform();
  const c = world.getComponent(camEntity, Camera);
  const p = world.getComponent(camEntity, Transform);
  if (c.targetEntity != -1 && world.hasComponent(c.targetEntity, Transform)) {
    const targetPos = world.getComponent(c.targetEntity, Transform);
    Object.assign(p, targetPos);
  }
  const sin = Math.sin(c.tilt) * c.zoom;
  const cos = Math.cos(c.tilt) * c.zoom;
  Ctx2D.ctx.transform(
    cos,
    sin,
    -sin,
    cos,
    cos * -p.x - sin * -p.y + Ctx2D.canvas.width * 0.5,
    sin * -p.x + cos * -p.y + Ctx2D.canvas.height * 0.5,
  );
}
function handleGravity(world: World) {
  world
    .query({ and: [Transform, Rect, Material, Acceleration] })
    .forEach((e) => {
      const r = world.getComponent(e, Rect);
      const m = world.getComponent(e, Material);
      const t = world.getComponent(e, Transform);
      const mass = r.width * r.height * m.density;
    });
}
function handleMovement(world: World) {
  world.query({ and: [Transform, Velocity, Acceleration] }).forEach((e) => {
    const t = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    const a = world.getComponent(e, Acceleration);
    v.x += (a.x * Time.dtMilli) / 1000;
    v.y += (a.y * Time.dtMilli) / 1000;
    t.x += (v.x * Time.dtMilli) / 1000;
    t.y += (v.y * Time.dtMilli) / 1000;
  });
}

// utils
function drawBackground(color = "#202020") {
  Ctx2D.ctx.resetTransform();
  Ctx2D.ctx.fillStyle = color;
  Ctx2D.ctx.fillRect(0, 0, Ctx2D.canvas.width, Ctx2D.canvas.height);
}
type vec2 = { x: number; y: number };
function screenToWorld(
  screenPos: vec2,
  cameraPos: vec2,
  cameraTilt: number,
  cameraZoom: number,
): vec2 {
  const cos = Math.cos(cameraTilt);
  const sin = Math.sin(cameraTilt);
  const res = { x: 0, y: 0 };
  const x = screenPos.x - Ctx2D.canvas.width / 2;
  const y = screenPos.y - Ctx2D.canvas.height / 2;
  res.x = cos * x + sin * y;
  res.y = -sin * x + cos * y;
  res.x /= cameraZoom;
  res.y /= cameraZoom;
  res.x += cameraPos.x;
  res.y += cameraPos.y;
  return res;
}
function pointerToScreen(pointerPos: vec2, canvas: HTMLCanvasElement): vec2 {
  const out = { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  out.x = pointerPos.x - rect.left;
  out.y = pointerPos.y - rect.top;
  if (innerWidth / innerHeight < canvas.width / canvas.height) {
    out.x *= canvas.width / innerWidth;
    out.y *= canvas.width / innerWidth;
  } else {
    out.x *= canvas.height / innerHeight;
    out.y *= canvas.height / innerHeight;
  }
  return out;
}

// initialization
const game = new World();

const camera = game.addEntity();
const camPos = game.addComponent(camera, Transform, { y: 1 });
const camComp = game.addComponent(camera, Camera, {
  zoom: 20,
  isActive: true,
});

const pointerRect = game.addEntity();
const pointerTransform = game.addComponent(pointerRect, Transform);
game.addComponent(pointerRect, Rect);

addPerson(game);
addPerson(game, 3);
addPerson(game, -3);

{
  (function update() {
    requestAnimationFrame(update);
    drawBackground();
    game.update(handleCamera, handleDrawing, handleMovement);
    updateTime(Time);
    updatePointer(Pointer);
    Object.assign(
      pointerTransform,
      screenToWorld(
        pointerToScreen(Pointer, Ctx2D.canvas),
        camPos,
        camComp.tilt,
        camComp.zoom,
      ),
    );
  })();
}
