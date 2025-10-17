type Rect = { width: number; height: number; cx: number; cy: number };
type Vec2 = { x: number; y: number };
enum Quads {
  Root,
  NW,
  NE,
  SW,
  SE,
}
export class Quadtree {
  private storage: Record<string, Rect[]> = {};
  private changed: Rect[] = [];
  private bounds: Record<string, Rect> = {};
  private maxDepth: number = 10;
  constructor(boundary: Rect, maxDepth: number = 10) {
    this.bounds[Quads.Root] = boundary;
    this.maxDepth = maxDepth;
    this.storage[Quads.Root] = [];
  }
  index(rect: Rect, index = Quads.Root.toString()): string {
    if (
      this.intersect(this.bounds[index], rect) &&
      index.length < this.maxDepth
    ) {
      const parentBound = this.bounds[index];
      this.bounds[index + Quads.NE.toString()] = {
        cx: parentBound.cx + parentBound.width / 4,
        cy: parentBound.cy + parentBound.height / 4,
        width: parentBound.width / 2,
        height: parentBound.height / 2,
      };
    }
    return index;
  }
  insert(rect: Rect): boolean {
    return false;
  }
  queryRange(rect: Rect): Rect[] {
    return [];
  }
  update() {}
  contain(r1: Rect, r2: Rect): boolean {
    return (
      (r1.cx - r2.cx) ** 2 < ((r1.width - r2.width) / 2) ** 2 &&
      (r1.cy - r2.cy) ** 2 < ((r1.height - r2.height) / 2) ** 2
    );
  }
  intersect(r1: Rect, r2: Rect): boolean {
    return (
      (r1.cx - r2.cx) ** 2 < ((r1.width + r2.width) / 2) ** 2 &&
      (r1.cy - r2.cy) ** 2 < ((r1.height + r2.height) / 2) ** 2
    );
  }
}
