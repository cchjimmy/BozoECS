import App from "../../app/app.ts";
import { addButton, addCamera } from "../entities.ts";
import { Camera } from "../components.ts";
import {
  handleCallbacks,
  handleCamera,
  handleQuadtreeElms,
  checkOnScreenEntities,
} from "../systems/core.ts";
import { drawRects, drawTexts } from "../systems/drawing.ts";
import { handleButtons } from "../systems/ui.ts";
import { default as config } from "../../config.json" with { type: "json" };

export const uiWorld = App.createWorld((world) => {
  addButton(
    world,
    config.viewport.width * 0.9,
    config.viewport.height * 0.8,
    config.viewport.height * 0.3,
    config.viewport.height * 0.3,
  );

  const cam = addCamera(
    world,
    config.viewport.width / 2,
    config.viewport.height / 2,
  );
  world.getComponent(cam, Camera).isActive = true;
});

App.setSystems(uiWorld, [
  handleCamera,
  handleQuadtreeElms,
  checkOnScreenEntities,
  drawRects,
  drawTexts,
  handleButtons,
  handleCallbacks,
]);
