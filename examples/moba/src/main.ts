import { default as config } from "./config.json" with { type: "json" };
import App from "./app/app.ts";
import { Transform, Text, Camera } from "./ecs/components.ts";
import { detectDeviceType, drawBg } from "./utils.ts";
import { gameWorld } from "./ecs/worlds/gameWorld.ts";
import { debugInfoWorld } from "./ecs/worlds/debugWorld.ts";
import { uiWorld } from "./ecs/worlds/uiWorld.ts";
import { testWorld } from "./ecs/worlds/testWorld.ts";
import "./ecs/worlds/worldHooks.ts";

App.canvas.width = config.viewport.width;
App.canvas.height = config.viewport.height;
App.canvas.style.imageRendering = "pixelated";

let mainWorld = gameWorld;

App.setWorldUpdateSequence([mainWorld, uiWorld, debugInfoWorld]);

App.onUpdate = () => {
  drawBg();

  if (App.keys.justPressed["1"]) mainWorld = gameWorld;
  if (App.keys.justPressed["2"]) mainWorld = testWorld;

  App.getWorldUpdateSequence()[0] = mainWorld;

  const game = App.getWorld(mainWorld);
  const debugInfo = App.getWorld(debugInfoWorld);

  const debugText = debugInfo.getComponent(
    debugInfo.query({ and: [Text] })[0],
    Text,
  );

  const camTransform = game.getComponent(
    game.query({ and: [Camera, Transform] })[0],
    Transform,
  );

  debugText.content = `FPS: ${Math.ceil(1000 / App.time.dtMilli)}\nEntity count: ${game.entityCount()}\nDevice type: ${detectDeviceType()}\nCam pos: (${Math.floor(camTransform.x)}, ${Math.floor(camTransform.y)})`;
};

App.run();
