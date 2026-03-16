import App from "../../app/app.ts";
import { addText } from "../entities.ts";
import { drawTexts } from "../systems/drawing.ts";

export const debugInfoWorld = App.createWorld((world) => {
  addText(world, 0, 0);
});

App.setSystems(debugInfoWorld, [drawTexts]);
