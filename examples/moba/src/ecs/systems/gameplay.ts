import { World } from "bozoecs";
import { Camera, Transform, PathFinder, IsPlayer } from "../components.ts";
import App from "../../app/app.ts";
import { pointerToScreen, screenToWorld } from "../../utils.ts";

export function handleInput(world: World) {
  const camEntity = world
    .query({ and: [Camera, Transform] })
    .find((e) => world.getComponent(e, Camera).isActive);
  if (camEntity == undefined) return;
  const camera = world.getComponent(camEntity, Camera);
  const camTransform = world.getComponent(camEntity, Transform);

  // click to move
  const justPressedId = App.pointers.justPressed.findIndex((x) => x);
  world.query({ and: [IsPlayer] }).forEach((e) => {
    if (justPressedId != -1) {
      const pf = world.addComponent(e, PathFinder);
      const pressPos = pointerToScreen(
        { x: App.pointers.x[justPressedId], y: App.pointers.y[justPressedId] },
        App.canvas,
      );
      const worldPos = screenToWorld(
        pressPos,
        camTransform,
        camera.tilt,
        camera.zoom,
      );
      pf.targetX = worldPos.x;
      pf.targetY = worldPos.y;
    }
  });
}
