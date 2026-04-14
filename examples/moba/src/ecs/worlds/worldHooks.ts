import App from "../../app/app.ts";
import { World } from "bozoecs";
import { isRect, isCircle } from "../../quadtree/shapes.ts";
import { QtreeShapes } from "../../quadtree/quadtree.ts";

function isQtreeElm(elm: object): elm is QtreeShapes {
  return (isRect(elm) || isCircle(elm)) && Object.hasOwn(elm, "owner");
}

World.onAddedComponent = (world, entity, component, instance) => {
  // for handleQuadtreeElms in systems
  if (isQtreeElm(component)) {
    App.getQuadtree(App.getWorldId(world)).insert(instance as typeof component);
  }
};

World.onRemoveComponent = (world, entity, component, instance) => {
  if (isQtreeElm(component)) {
    App.getQuadtree(App.getWorldId(world)).eraseExact(
      instance as typeof component,
    );
  }
};
