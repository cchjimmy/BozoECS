import App from "../../app/app.ts";
import { World } from "bozoecs";
import { isRect, isCircle } from "../../quadtree/shapes.ts";
import { QtreeShapes } from "../../quadtree/quadtree.ts";

function isQtreeElm(elm: object): elm is QtreeShapes {
  return (isRect(elm) || isCircle(elm)) && Object.hasOwn(elm, "owner");
}

World.onAddComponent = (world, entity, component) => {
  // for handleQuadtreeElms in systems
  if (isQtreeElm(component)) {
    App.getQuadtree(App.getWorldId(world)).insert(
      world.getComponent(entity, component),
    );
  }
};

World.onRemoveComponent = (world, entity, component) => {
  if (isQtreeElm(component)) {
    App.getQuadtree(App.getWorldId(world)).eraseExact(
      world.getComponent(entity, component),
    );
  }
};
