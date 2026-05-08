import pointers from "../../plugins/pointers/api.ts";
import ctx from "../../plugins/resizingCanvas/api.ts";
import { World } from "bozoecs";
import { pointerToScreen } from "../../utils.ts";
import { Button, Transform, Rect } from "../components.ts";

export function handleButtons(world: World) {
  world.query({ and: [Button, Transform, Rect] }).forEach((e) => {
    const p = world.getComponent(e, Transform);
    const b = world.getComponent(e, Button);
    const r = world.getComponent(e, Rect);
    b.hovered = b.isDown = b.clicked = false;
    for (let i = 0, l = pointers.x.length; i < l; i++) {
      const pointerPos = pointerToScreen(
        { x: pointers.x[i], y: pointers.y[i] },
        ctx.canvas,
      );
      const currentHovered =
        (pointerPos.x - p.x) ** 2 < (r.width / 2) ** 2 &&
        (pointerPos.y - p.y) ** 2 < (r.height / 2) ** 2;
      b.hovered ||= currentHovered;
      b.isDown ||= currentHovered && pointers.isDown[i];
      b.clicked ||= currentHovered && pointers.justReleased[i];
    }
  });
}
