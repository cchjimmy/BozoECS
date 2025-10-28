import { World } from "bozoecs";

// singletons
const Ctx2D = setUpCanvas2D();
const Time = setUpTime();
const Keys = setUpKeyboard();
const Pointer = setUpPointer();
const Game = {
  snakeWidth: 10,
  foodRadius: 15,
  startLength: 5,
  foodColor: "#F0A0A0",
  snakeColor: "#F0D0D0",
};

function setUpCanvas2D(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
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
function setUpKeyboard(): Record<
  "isDown" | "justPressed" | "justReleased",
  Record<string, boolean>
> {
  const keys: ReturnType<typeof setUpKeyboard> = {
    isDown: {},
    justPressed: {},
    justReleased: {},
  };

  globalThis.onkeydown = (e) => {
    !keys.isDown[e.key] && (keys.justPressed[e.key] = true);
    keys.isDown[e.key] = true;
  };
  globalThis.onkeyup = (e) => {
    keys.isDown[e.key] = false;
    keys.justReleased[e.key] = true;
  };

  return keys;
}
function updateKeyboard(
  keys: Record<
    "isDown" | "justPressed" | "justReleased",
    Record<string, boolean>
  >,
) {
  for (const key in keys.justPressed) keys.justPressed[key] = false;
  for (const key in keys.justReleased) keys.justReleased[key] = false;
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
  pointer: Record<"isDown" | "justPressed" | "justReleased", boolean>,
) {
  pointer.justPressed = false;
  pointer.justReleased = false;
}

// components
const Transform = { x: 0, y: 0, rad: 0 };
const Velocity = { x: 0, y: 0 };
const Hierarchy = { parent: -1, child: -1 };
const PlayerControl = {};
const isFood = {};

// systems
function handleMovement(world: World) {
  world.query({ and: [Transform, Velocity] }).forEach((e) => {
    const p = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    p.x += (v.x * Time.dtMilli) / 1000;
    p.y += (v.y * Time.dtMilli) / 1000;
    if (v.x == 0 && v.y == 0) return;
    p.rad = Math.atan2(v.y, v.x);
  });
}
function handleDrawing(world: World) {
  Ctx2D.ctx.fillStyle = "#202020";
  Ctx2D.ctx.fillRect(0, 0, Ctx2D.canvas.width, Ctx2D.canvas.height);
  Ctx2D.ctx.fillStyle = Game.foodColor;
  Ctx2D.ctx.beginPath();
  world.query({ and: [Transform, isFood] }).forEach((e) => {
    const p = world.getComponent(e, Transform);
    Ctx2D.ctx.ellipse(
      p.x,
      p.y,
      Game.foodRadius,
      Game.foodRadius,
      0,
      0,
      Math.PI * 2,
    );
  });
  Ctx2D.ctx.fill();
  Ctx2D.ctx.beginPath();
  world.query({ and: [Transform, Hierarchy] }).forEach((e) => {
    const h = world.getComponent(e, Hierarchy);
    const p = world.getComponent(e, Transform);
    Ctx2D.ctx.moveTo(p.x, p.y);
    if (h.child != -1 && world.hasComponent(h.child, Transform)) {
      const childTransform = world.getComponent(h.child, Transform);
      Ctx2D.ctx.lineTo(childTransform.x, childTransform.y);
    }
  });
  Ctx2D.ctx.strokeStyle = Game.snakeColor;
  Ctx2D.ctx.lineCap = "round";
  Ctx2D.ctx.lineWidth = Game.snakeWidth;
  Ctx2D.ctx.stroke();

  const tail = world.query({ and: [Hierarchy] }).find((e) => {
    return world.getComponent(e, Hierarchy).child == -1;
  });
  if (tail) {
    const tailTransform = world.getComponent(tail, Transform);
    const c = Math.cos(tailTransform.rad);
    const s = Math.sin(tailTransform.rad);
    Ctx2D.ctx.beginPath();
    let x = 0;
    let y = -Game.snakeWidth / 2;
    Ctx2D.ctx.moveTo(
      c * x - s * y + tailTransform.x,
      s * x + c * y + tailTransform.y,
    );
    x = 0;
    y = +Game.snakeWidth / 2;
    Ctx2D.ctx.lineTo(
      c * x - s * y + tailTransform.x,
      s * x + c * y + tailTransform.y,
    );
    x = -Game.snakeWidth * 2;
    y = 0;
    Ctx2D.ctx.lineTo(
      c * x - s * y + tailTransform.x,
      s * x + c * y + tailTransform.y,
    );
    Ctx2D.ctx.fillStyle = Game.snakeColor;
    Ctx2D.ctx.fill();
  }

  const head = world.query({ and: [Hierarchy] }).find((e) => {
    return world.getComponent(e, Hierarchy).parent == -1;
  });
  if (head) {
    Ctx2D.ctx.fillStyle = "white";
    const headTransform = world.getComponent(head, Transform);
    const c = Math.cos(headTransform.rad);
    const s = Math.sin(headTransform.rad);
    const offset = 5;
    const eyeRadius = 4;
    const pupilRadius = 2;
    Ctx2D.ctx.beginPath();
    let x = 0;
    let y = -offset;
    const leftEyeX = c * x - s * y + headTransform.x;
    const leftEyeY = s * x + c * y + headTransform.y;
    Ctx2D.ctx.ellipse(
      leftEyeX,
      leftEyeY,
      eyeRadius,
      eyeRadius,
      headTransform.rad,
      0,
      Math.PI * 2,
    );
    x = 0;
    y = offset;
    const rightEyeX = c * x - s * y + headTransform.x;
    const rightEyeY = s * x + c * y + headTransform.y;
    Ctx2D.ctx.ellipse(
      rightEyeX,
      rightEyeY,
      eyeRadius,
      eyeRadius,
      headTransform.rad,
      0,
      Math.PI * 2,
    );
    Ctx2D.ctx.fill();
    Ctx2D.ctx.fillStyle = "black";
    Ctx2D.ctx.beginPath();
    let leftPupilX = leftEyeX;
    let leftPupilY = leftEyeY;
    const food = world.query({ and: [isFood, Transform] })[0];
    if (food) {
      const foodTransform = world.getComponent(food, Transform);
      let dirX = foodTransform.x - leftPupilX;
      let dirY = foodTransform.y - leftPupilY;
      const mag = (dirX ** 2 + dirY ** 2) ** 0.5;
      ((dirX /= mag), (dirY /= mag));
      const eyePupilDiff = eyeRadius - pupilRadius;
      leftPupilX += dirX * eyePupilDiff;
      leftPupilY += dirY * eyePupilDiff;
    }
    Ctx2D.ctx.ellipse(
      leftPupilX,
      leftPupilY,
      pupilRadius,
      pupilRadius,
      headTransform.rad,
      0,
      Math.PI * 2,
    );
    let rightPupilX = rightEyeX;
    let rightPupilY = rightEyeY;
    if (food) {
      const foodTransform = world.getComponent(food, Transform);
      let dirX = foodTransform.x - rightPupilX;
      let dirY = foodTransform.y - rightPupilY;
      const mag = (dirX ** 2 + dirY ** 2) ** 0.5;
      ((dirX /= mag), (dirY /= mag));
      const eyePupilDiff = eyeRadius - pupilRadius;
      rightPupilX += dirX * eyePupilDiff;
      rightPupilY += dirY * eyePupilDiff;
    }
    Ctx2D.ctx.ellipse(
      rightPupilX,
      rightPupilY,
      pupilRadius,
      pupilRadius,
      headTransform.rad,
      0,
      Math.PI * 2,
    );
    Ctx2D.ctx.fill();
  }

  Ctx2D.ctx.fillStyle = "white";
  Ctx2D.ctx.fillText(
    `Score: ${world.query({ and: [Hierarchy] }).length - Game.startLength}; Best: ${localStorage.getItem("snake_best") ?? 0}`,
    0,
    10,
  );
}
function handleInput(world: World) {
  world.query({ and: [PlayerControl, Velocity] }).forEach((e) => {
    const v = world.getComponent(e, Velocity);
    let angularVel = 0;
    if (
      Keys.isDown["a"] ||
      Keys.isDown["ArrowLeft"] ||
      (Pointer.isDown && Pointer.x < innerWidth / 2)
    ) {
      angularVel -= Math.PI;
    }
    if (
      Keys.isDown["d"] ||
      Keys.isDown["ArrowRight"] ||
      (Pointer.isDown && Pointer.x > innerWidth / 2)
    ) {
      angularVel += Math.PI;
    }
    const c = Math.cos((angularVel * Time.dtMilli) / 1000);
    const s = Math.sin((angularVel * Time.dtMilli) / 1000);
    const x = v.x,
      y = v.y;
    v.x = c * x - s * y;
    v.y = s * x + c * y;
  });
}
function handleReset(world: World) {
  world
    .query({ and: [PlayerControl, Transform, Hierarchy, Velocity] })
    .forEach((e) => {
      const p = world.getComponent(e, Transform);
      const collidedBody = world
        .query({ and: [Hierarchy], not: [PlayerControl] })
        .find((other) => {
          const otherH = world.getComponent(other, Hierarchy);
          if (otherH.parent == e) return false;
          const otherP = world.getComponent(other, Transform);
          return (otherP.x - p.x) ** 2 + (otherP.y - p.y) ** 2 < 6 ** 2;
        });
      if (
        p.x > Ctx2D.canvas.width ||
        p.x < 0 ||
        p.y > Ctx2D.canvas.height ||
        p.y < 0 ||
        world.entityCount() < Game.startLength ||
        collidedBody != undefined
      ) {
        const score =
          world.query({ and: [Hierarchy] }).length - Game.startLength;
        if (
          score > Number.parseInt(localStorage.getItem("snake_best") ?? "0")
        ) {
          localStorage.setItem("snake_best", score.toString());
        }
        p.x = Ctx2D.canvas.width / 2;
        p.y = Ctx2D.canvas.height / 2;
        world
          .query({ not: [PlayerControl] })
          .forEach((e) => world.deleteEntity(e));
        world.getComponent(e, Hierarchy).child = -1;
        const v = world.getComponent(e, Velocity);
        ((v.x = 40), (v.y = 0));
        let parent = e;
        for (let i = 0; i < Game.startLength - 1; i++) {
          const bodyPart = world.addEntity();
          world.addComponent(bodyPart, Velocity);
          world.addComponent(bodyPart, Hierarchy, { parent });
          const parentTransform = world.getComponent(parent, Transform);
          world.addComponent(bodyPart, Transform, {
            x: parentTransform.x - 6,
            y: parentTransform.y,
          });
          world.getComponent(parent, Hierarchy).child = bodyPart;
          parent = bodyPart;
        }
      }
    });
}
function handleSpawnFood(world: World) {
  const food = world.query({ and: [isFood] });
  if (food.length > 0) return;
  // spawn food
  const foodEntity = world.addEntity();
  world.addComponent(foodEntity, isFood);
  world.addComponent(foodEntity, Transform, {
    x: Math.random() * Ctx2D.canvas.width,
    y: Math.random() * Ctx2D.canvas.height,
  });
}
function handleEatFood(world: World) {
  world.query({ and: [PlayerControl, Transform] }).forEach((e) => {
    const playerTransform = world.getComponent(e, Transform);
    world.query({ and: [isFood, Transform] }).forEach((foodE) => {
      const foodTransform = world.getComponent(foodE, Transform);
      if (
        (playerTransform.x - foodTransform.x) ** 2 <
          ((Game.snakeWidth + Game.foodRadius) / 2) ** 2 &&
        (playerTransform.y - foodTransform.y) ** 2 <
          ((Game.snakeWidth + Game.foodRadius) / 2) ** 2
      ) {
        world.deleteEntity(foodE);
        const parent = world
          .query({ and: [Hierarchy] })
          .find((e) => world.getComponent(e, Hierarchy).child == -1);
        if (
          !parent ||
          !world.hasComponent(parent, Transform) ||
          !world.hasComponent(parent, Hierarchy)
        )
          return;
        // spawn new body part
        const bodyPart = world.addEntity();
        world.addComponent(bodyPart, Velocity);
        world.addComponent(bodyPart, Hierarchy, { parent });
        world.addComponent(
          bodyPart,
          Transform,
          world.getComponent(parent, Transform),
        );
        world.getComponent(parent, Hierarchy).child = bodyPart;
      }
    });
  });
}
function handleEntityHierarchy(world: World) {
  world.query({ and: [Hierarchy, Transform, Velocity] }).forEach((e) => {
    const h = world.getComponent(e, Hierarchy);
    const p = world.getComponent(e, Transform);
    const v = world.getComponent(e, Velocity);
    if (
      h.parent != -1 &&
      world.hasComponent(h.parent, Transform) &&
      world.hasComponent(h.parent, Velocity)
    ) {
      const parentTransform = world.getComponent(h.parent, Transform);
      if (
        (p.x - parentTransform.x) ** 2 + (p.y - parentTransform.y) ** 2 <
        50
      ) {
        v.x = v.y = 0;
        return;
      }
      const parentVelocity = world.getComponent(h.parent, Velocity);
      const velocityMag =
        (parentVelocity.x ** 2 + parentVelocity.y ** 2) ** 0.5;
      const dx = parentTransform.x - p.x;
      const dy = parentTransform.y - p.y;
      const distance = (dx ** 2 + dy ** 2) ** 0.5;
      v.x = (dx / distance) * velocityMag;
      v.y = (dy / distance) * velocityMag;
    }
  });
}

// initialization
const game = new World();
const player = game.addEntity();
game.addComponent(player, Transform, {
  x: Ctx2D.canvas.width / 2,
  y: Ctx2D.canvas.height / 2,
});
game.addComponent(player, Velocity, { x: 40 });
game.addComponent(player, PlayerControl);
game.addComponent(player, Hierarchy);

// loop
{
  (function update() {
    requestAnimationFrame(update);
    game.update(
      handleDrawing,
      handleReset,
      handleSpawnFood,
      handleEatFood,
      handleInput,
      handleMovement,
      handleEntityHierarchy,
    );
    updateTime(Time);
    updateKeyboard(Keys);
    updatePointer(Pointer);
  })();
}
