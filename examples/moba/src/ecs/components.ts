import { World, entityT } from "bozoecs";
import { QtreeRect, QtreeCircle } from "../quadtree/quadtree.ts";

export const QtRect: QtreeRect & { owner: number } = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  owner: -1,
};
export const QtCircle: QtreeCircle & { owner: number } = {
  x: 0,
  y: 0,
  radius: 1,
  owner: -1,
};
export const Stats = {
  attackPoint: 0,
  defencePoint: 0,
  abilityPower: 0,
  moveSpeed: 0,
  attackSpeed: 0,
};
export const Health = { current: 0, max: 0 };
export const Callback = { fn: (_: entityT) => {} };
export const Transform = { x: 0, y: 0, rad: 0, scaleX: 1, scaleY: 1 };
export const Velocity = { x: 0, y: 0 };
export const IsPlayer = {};
export const OnScreen = {};
export const ParticleEmitter = {
  spreadRadians: 0,
  particleEntity: -1,
  particleLifetimeSeconds: 1,
  emit: false,
  particleTransition: function (
    world: World,
    particleEntity: entityT,
    percentageLifeTime: number,
  ) {
    const t = world.getComponent(particleEntity, Transform);
    t.scaleX = t.scaleY = -((2 * percentageLifeTime - 1) ** 10) + 1;
  },
};
export const Camera = { zoom: 1, tilt: 0, isActive: false, targetEntity: -1 };
export const Rect = { width: 1, height: 1, x: -0.5, y: -0.5 };
export const Circle = { radius: 1, x: 0, y: 0 };
export const Graphic = { image: new Image() };
export const Button = { hovered: false, pressed: false, clicked: false };
export const Color = { fill: "white", stroke: "black" };
export const Text = {
  content: "",
  fontSize: 20,
  padding: 3,
  color: "black",
  backgroundColor: "white",
};
export const Timer = { timeSeconds: 0, reset: false, pause: false };
export const PathFinder = { targetX: 0, targetY: 0 };
