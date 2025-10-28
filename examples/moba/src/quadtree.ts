type Rect = { width: number; height: number; cx: number; cy: number };
enum Quads {
  Root,
  NE,
  NW,
  SE,
  SW,
}
export class Quadtree {
  private storage: Record<string, Set<Rect>> = {};
  private changed: Rect[] = [];
  private bounds: Record<string, Rect> = {};
  private maxDepth: number = 10;
  constructor(boundary: Rect, maxDepth: number = 10) {
    this.bounds[Quads.Root] = boundary;
    this.maxDepth = maxDepth;
    this.storage[Quads.Root] = new Set();
  }
  index(rect: Rect, index = Quads.Root.toString()): string {
    if (index.length >= this.maxDepth) return index;
    const parentBound = this.bounds[index];
    // i as enum values of Quads
    for (let i = 0; i < 4; i++) {
      this.bounds[index + i.toString()] ??= {
        cx: parentBound.cx + (parentBound.width / 4) * (i % 2 == 0 ? 1 : -1),
        cy: parentBound.cy + (parentBound.height / 4) * (i < 1 ? 1 : -1),
        width: parentBound.width / 2,
        height: parentBound.height / 2,
      };
      if (this.contain(this.bounds[index + i.toString()], rect))
        return this.index(rect, index + i.toString());
    }
    return index;
  }
  insert(rect: Rect) {
    const index = this.index(rect);
    this.storage[index] ??= new Set();
    this.storage[index].add(rect);
  }
  queryRange(rect: Rect): Rect[] {
    return [...this.storage[this.index(rect)]];
  }
  update() {
    for (const index in this.storage) {
      for (const rect of this.storage[index].values()) {
        if (!this.contain(this.bounds[index], rect)) this.changed.push(rect);
      }
    }
    while (this.changed.length) {
      const rect = this.changed.pop();
      if (!rect) continue;
      this.insert(rect);
    }
  }
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
