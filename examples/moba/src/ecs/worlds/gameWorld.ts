import App from "../../app/app.ts";
import {
  addPlayer,
  addTurrents,
  addFountains,
  addSpawners,
  addGraphic,
  addCamera,
} from "../entities.ts";
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

export const gameWorld = App.createWorld((world) => {
  App.getQuadtree(App.getWorldId(world)).setBoundary({
    x: -150,
    y: -150,
    width: 300,
    height: 300,
  });
  const player = addPlayer(world, -146, 146);
  // const player = addPlayer(world, -115, 115);
  // const player = addPlayer(world, 0, 0);
  addTurrents(world);
  addFountains(world);
  addSpawners(world);
  /**
   * By Original PNG version by Raizin, SVG rework by Sameboat. - file:Map of MOBA.png (CC 3.0), CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=29443207
   */
  addGraphic(world, "./assets/Map_of_MOBA.svg", -150, -150, 300, 300);

  const cam = addCamera(world, -146, 146);
  const camComponent = world.getComponent(cam, Camera);
  camComponent.targetEntity = player;
  camComponent.isActive = true;
  camComponent.zoom = 20;

  // const cleaner = world.addEntity();
  // world.addComponent(cleaner, Timer);
  // world.addComponent(cleaner, Callback, {
  //   fn(e) {
  //     const t = world.getComponent(e, Timer);
  //     if (t.timeMilli < 1000 * 60 * 5) return;
  //     t.reset = true;
  //     world.cleanObjectPools();
  //   },
  // });
});

App.setSystems(gameWorld, [
  handleCamera,
  handleQuadtreeElms,
  checkOnScreenEntities,
  drawImg,
  drawCircles,
  drawRects,
  drawHealthBars,
  drawTexts,
  drawPathFindTargets,
  // drawParticleEmitters,
  // drawQuadTree,
  // drawCameraRect,
  handleParticleEmitters,
  handlePathfind,
  handleInput,
  handleCallbacks,
  handleTimers,
  handleMovement,
  handleCollision,
]);
