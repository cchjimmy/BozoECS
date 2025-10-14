type Rect = {
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotation: number;
};
enum Quads {
  NW,
  NE,
  SW,
  SE,
}
export class Quadtree {
  private storage: Rect[] = [];
  private changed: Rect[] = [];
  private children: Quadtree[] = [];
  private capacity = 4;

  insert(rect: Rect): boolean {}
  subdivide(): boolean {}
  queryRange(rect: Rect): Rect[] {}
  update() {}
}
