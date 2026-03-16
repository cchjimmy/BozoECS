import App from "../../app/app.ts";
import { World } from "bozoecs";
import { pointerToScreen } from "../../utils.ts";
import { Button, Transform, Rect } from "../components.ts";

export function handleButtons(world: World) {
  for (let i = 0, l = App.pointers.x.length; i < l; i++) {
    const pointerPos = pointerToScreen(
      { x: App.pointers.x[i], y: App.pointers.y[i] },
      App.canvas,
    );
    const pressPos = pointerToScreen(
      { x: App.pointers.pressX[i], y: App.pointers.pressY[i] },
      App.canvas,
    );
    const releasePos = pointerToScreen(
      { x: App.pointers.releaseX[i], y: App.pointers.releaseY[i] },
      App.canvas,
    );
    world.query({ and: [Button, Transform, Rect] }).forEach((e) => {
      const p = world.getComponent(e, Transform);
      const b = world.getComponent(e, Button);
      const r = world.getComponent(e, Rect);
      const pressedWithinButton =
        (pressPos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
        (pressPos.y - p.y) ** 2 < (r.height / 2) ** 2;
      b.hovered =
        (pointerPos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
        (pointerPos.y - p.y) ** 2 < (r.height / 2) ** 2;
      b.pressed = b.hovered && App.pointers.isDown[i] && pressedWithinButton;
      b.clicked =
        App.pointers.justReleased[i] &&
        pressedWithinButton &&
        (releasePos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
        (releasePos.y - p.y) ** 2 < (r.height / 2) ** 2;
    });
  }
}
