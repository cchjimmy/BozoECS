import App from "../../app/app.ts";
import { addMinion, addPlayer, addCamera } from "../entities.ts";
import { Camera } from "../components.ts";
import { handleInput } from "../systems/gameplay.ts";
import {
  handleCamera,
  handleTimers,
  handleMovement,
  handlePathfind,
  handleCallbacks,
  handleCollision,
  handleQuadtreeElms,
  handleParticleEmitters,
} from "../systems/core.ts";
import { checkOnScreenEntities } from "../systems/core.ts";
import {
  drawImg,
  drawRects,
  drawTexts,
  drawCircles,
  drawHealthBars,
  drawPathFindTargets,
  drawParticleEmitters,
  drawQuadTree,
  drawCameraRect,
} from "../systems/drawing.ts";

export const testWorld = App.createWorld((world) => {
  const qtreeWidth = 30;
  const qtreeHeight = 15;
  App.getQuadtree(App.getWorldId(world)).setBoundary({
    x: qtreeWidth / -2,
    y: qtreeHeight / -2,
    width: qtreeWidth,
    height: qtreeHeight,
  });
  const player = addPlayer(world, 0, 0);
  const cam = addCamera(world, 0, 0);
  const camComp = world.getComponent(cam, Camera);
  // camComp.targetEntity = player;
  camComp.isActive = true;
  camComp.zoom = 20;
  addMinion(world, 10, 0);
});

App.setSystems(testWorld, [
  handleCamera,
  handleQuadtreeElms,
  checkOnScreenEntities,
  drawImg,
  drawCircles,
  drawRects,
  drawHealthBars,
  drawTexts,
  drawPathFindTargets,
  drawParticleEmitters,
  drawQuadTree,
  drawCameraRect,
  handleParticleEmitters,
  handlePathfind,
  handleInput,
  handleCallbacks,
  handleTimers,
  handleMovement,
  handleCollision,
]);
