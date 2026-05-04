import pointers from "../../plugins/pointers/api.ts";
import ctx from "../../plugins/resizingCanvas/api.ts";
import { World } from "bozoecs";
import { pointerToScreen } from "../../utils.ts";
import { Button, Transform, Rect } from "../components.ts";

export function handleButtons(world: World) {
  for (let i = 0, l = pointers.x.length; i < l; i++) {
    const pointerPos = pointerToScreen(
      { x: pointers.x[i], y: pointers.y[i] },
      ctx.canvas,
    );
    const pressPos = pointerToScreen(
      { x: pointers.pressX[i], y: pointers.pressY[i] },
      ctx.canvas,
    );
    const releasePos = pointerToScreen(
      { x: pointers.releaseX[i], y: pointers.releaseY[i] },
      ctx.canvas,
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
      b.pressed = b.hovered && pointers.isDown[i] && pressedWithinButton;
      b.clicked =
        pointers.justReleased[i] &&
        pressedWithinButton &&
        (releasePos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
        (releasePos.y - p.y) ** 2 < (r.height / 2) ** 2;
    });
  }
}
