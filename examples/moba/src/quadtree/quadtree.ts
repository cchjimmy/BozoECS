import {
  QtreeShapes,
  QtreeRect,
  isCircle,
  rectContainCircle,
  isRect,
  rectContainRect,
  isLine,
  rectContainLine,
  QtreeLine,
  RayIntersectShape,
  rectIntersectRay,
  rectContainShape,
  shapeIntersectShape,
  rectIntersectShape,
  circleIntersectShape,
  rectIntersectCircle,
  rectIntersectRect,
  lineIntersectShape,
  rectIntersectLine,
  QtreeCircle,
} from "./shapes.ts";

export type { QtreeCircle, QtreeLine, QtreeShapes, QtreeRect };

enum QUADRANTS {
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
}

function calculateId(accum: number, quadrant: QUADRANTS, depth: number) {
  return accum + (quadrant + 1) * 5 ** depth;
}

type MapValue<T> = T extends Map<unknown, infer V> ? V : never;

export class Quadtree {
  private storage: Map<number, Set<QtreeShapes>>[] = [];
  private bounds: Map<number, QtreeRect> = new Map();
  private maxDepth: number = 10;
  private currentLayer = 0;
  constructor(
    boundary: QtreeRect = { x: 0, y: 0, width: 100, height: 100 },
    maxDepth: number = 10,
  ) {
    this.bounds.set(0, boundary);
    this.maxDepth = maxDepth;
    this.storage[this.currentLayer] = new Map();
    this.storage[this.currentLayer].set(0, new Set());
  }
  setBoundary(boundary: QtreeRect) {
    this.bounds.clear();
    this.bounds.set(0, boundary);
    const temp: QtreeShapes[] = [];
    for (let i = 0, l = this.storage.length; i < l; i++) {
      for (const value of this.storage[i]) {
        temp.push(...value[1]);
        value[1].clear();
      }
    }
    while (temp.length) {
      const shape = temp.pop();
      if (!shape) continue;
      this.insert(shape);
    }
  }
  setCurrentLayer(layer: number) {
    this.storage[layer] ??= new Map();
    this.currentLayer = layer;
  }
  private index<S extends QtreeShapes>(
    shape: S,
    containFn: (r: QtreeRect, s: S) => boolean,
  ): number {
    let index = 0;
    let depth = 1;
    let contained = true;
    while (contained && depth <= this.maxDepth) {
      contained = false;
      const parentBound = this.bounds.get(index);
      if (!parentBound) throw new Error();
      for (let i = 0; i < 4; i++) {
        const id = calculateId(index, i, depth);
        if (!this.bounds.has(id)) {
          this.bounds.set(id, {
            x: parentBound.x + (parentBound.width / 2) * (i % 2),
            y: parentBound.y + (parentBound.height / 2) * +(i > 1),
            width: parentBound.width / 2,
            height: parentBound.height / 2,
          });
        }
        const childBound = this.bounds.get(id);
        if (childBound && !containFn(childBound, shape)) continue;
        index = id;
        contained = true;
        depth++;
        break;
      }
    }
    return index;
  }
  insert(shape: QtreeShapes) {
    let index = 0;
    if (isCircle(shape)) {
      index = this.index(shape, rectContainCircle);
    } else if (isRect(shape)) {
      index = this.index(shape, rectContainRect);
    } else if (isLine(shape)) {
      index = this.index(shape, rectContainLine);
    }
    if (!this.storage[this.currentLayer].has(index))
      this.storage[this.currentLayer].set(index, new Set());
    const store = this.storage[this.currentLayer].get(index);
    if (store == undefined) throw new Error();
    store.add(shape);
  }
  forEach<S extends QtreeShapes>(
    query: S,
    fn: (s: QtreeShapes, store: Set<QtreeShapes>) => void,
  ): void {
    let shapeIntersectShapesFn: unknown;
    let rectIntersectShapeFn: unknown;
    if (isCircle(query)) {
      shapeIntersectShapesFn = circleIntersectShape;
      rectIntersectShapeFn = rectIntersectCircle;
    } else if (isRect(query)) {
      shapeIntersectShapesFn = rectIntersectShape;
      rectIntersectShapeFn = rectIntersectRect;
    } else if (isLine(query)) {
      shapeIntersectShapesFn = lineIntersectShape;
      rectIntersectShapeFn = rectIntersectLine;
    }
    this.traverse(
      query,
      fn,
      shapeIntersectShapesFn as (a: S, b: QtreeShapes) => boolean,
      rectIntersectShapeFn as (a: QtreeRect, b: S) => boolean,
    );
  }
  query<S extends QtreeShapes>(
    shape: S,
    res: QtreeShapes[] = [],
  ): QtreeShapes[] {
    this.forEach(shape, (s) => res.push(s));
    return res;
  }
  queryRay(ray: QtreeLine, res: QtreeShapes[] = []): QtreeShapes[] {
    // (x1, y1) is origin, (x2, y2) provides direction for ray
    // this uses traverse because there are dedicated functions for rays
    // forEach does not work with rays
    this.traverse(ray, (v) => res.push(v), RayIntersectShape, rectIntersectRay);
    return res;
  }
  update() {
    const elms: QtreeShapes[] = [];
    for (const v of this.storage[this.currentLayer]) {
      const childBound = this.bounds.get(v[0]);
      if (!childBound) continue;
      for (const s of v[1]) {
        v[1].delete(s);
        elms.push(s);
      }
    }
    while (elms.length) {
      const shape = elms.pop();
      if (shape == undefined) continue;
      this.insert(shape);
    }
  }
  private traverse<S extends QtreeShapes>(
    shape: S,
    op: (
      intersectedShape: QtreeShapes,
      correspondingStorage: MapValue<(typeof this.storage)[number]>,
    ) => void,
    shapeIntersectShapesFn: (
      a: S,
      b: QtreeShapes,
    ) => boolean = shapeIntersectShape,
    rectIntersectShapeFn: (a: QtreeRect, b: S) => boolean = rectIntersectShape,
    index = 0,
    depth = 0,
  ) {
    const store = this.storage[this.currentLayer].get(index);
    if (store) {
      for (const s of store) {
        if (!shapeIntersectShapesFn(shape, s)) continue;
        op(s, store);
      }
    }
    depth++;
    for (let i = 0; i < 4; i++) {
      const id = calculateId(index, i, depth);
      const childBound = this.bounds.get(id);
      if (!childBound || !rectIntersectShapeFn(childBound, shape)) continue;
      this.traverse(
        shape,
        op,
        shapeIntersectShapesFn,
        rectIntersectShapeFn,
        id,
        depth,
      );
    }
  }
  eraseIntersected<S extends QtreeShapes>(shape: S) {
    this.forEach(shape, (s, store) => store.delete(s));
  }
  eraseExact(shape: QtreeShapes) {
    this.forEach(shape, (s, store) => {
      if (s != shape) return;
      store.delete(s);
    });
  }
  clear() {
    for (const v of this.storage[this.currentLayer]) {
      v[1].clear();
    }
  }
  size() {
    let count = 0;
    for (const v of this.storage[this.currentLayer]) {
      count += v[1].size;
    }
    return count;
  }
  drawTree(ctx: CanvasRenderingContext2D, color = "green") {
    for (const value of this.storage[this.currentLayer]) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      for (const shape of value[1]) {
        if (isRect(shape)) {
          ctx.moveTo(shape.x, shape.y);
          ctx.rect(shape.x, shape.y, shape.width, shape.height);
        } else if (isCircle(shape)) {
          ctx.moveTo(shape.x + shape.radius, shape.y);
          ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        } else if (isLine(shape)) {
          ctx.moveTo(shape.x1, shape.y1);
          ctx.lineTo(shape.x2, shape.y2);
        }
      }
      if (value[1].size) {
        const bound = this.bounds.get(value[0]);
        if (!bound) continue;
        ctx.moveTo(bound.x, bound.y);
        ctx.rect(bound.x, bound.y, bound.width, bound.height);
      }
      ctx.stroke();
    }
  }
}
