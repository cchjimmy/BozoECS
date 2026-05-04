import { Plugin } from "../../core/app.ts";
import keys from "../keyboard/api.ts";
import ctx from "../resizingCanvas/api.ts";
import config from "../../config.json" with { type: "json" };
import game from "./gameWorld.ts";
import test from "./testWorld.ts";

let main = game;

const plug: Plugin = {
  setUp: () => {
    ctx.canvas.width = config.viewport.width;
    ctx.canvas.height = config.viewport.height;
    // ctx.canvas.style.imageRendering = "pixelated";
    game.setUp();
    test.setUp();
  },
  update: () => {
    if (keys.justPressed["1"]) {
      main = game;
    }
    if (keys.justPressed["2"]) {
      main = test;
    }
    main.update();
  },
};

export default plug;
