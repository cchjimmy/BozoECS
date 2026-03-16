import { World, systemT } from "bozoecs";
import { setUpCanvasAPI } from "./canvas.ts";
import { setUpKeyboard, updateKeyboard } from "./keys.ts";
import { setUpPointers, updatePointers } from "./pointers.ts";
import { setUpTime, updateTime } from "./time.ts";
import { Quadtree } from "../quadtree/quadtree.ts";

export default class App {
  static readonly time = setUpTime();
  static readonly keys = setUpKeyboard();
  static readonly pointers = setUpPointers();
  private static readonly ctx2d = setUpCanvasAPI("2d");

  static readonly ctx = App.ctx2d.ctx;
  static readonly canvas = App.ctx2d.canvas;

  private static ws: World[] = [];
  private static ss: systemT[][] = [];
  private static qs: Quadtree[] = [];
  private static wus: number[];

  static createWorld(initWorld: (_: World) => void): number {
    const world = new World();
    App.ws.push(world);
    App.qs.push(
      new Quadtree({ x: -1e10, y: -1e10, width: 2e10, height: 2e10 }, 25),
    );
    initWorld(world);
    return App.ws.length - 1;
  }

  static getWorld(worldId: number): World {
    if (App.ws[worldId] == undefined) throw new Error("No such world.");
    return App.ws[worldId];
  }

  static getWorldId(world: World): number {
    for (let i = 0, l = App.ws.length; i < l; i++) {
      if (App.ws[i] != world) continue;
      return i;
    }
    return -1;
  }

  static getQuadtree(worldId: number): Quadtree {
    if (App.qs[worldId] == undefined) throw new Error("No such world.");
    return App.qs[worldId];
  }

  static setSystems(worldId: number, systems: systemT[]) {
    App.ss[worldId] = systems;
  }

  static setWorldUpdateSequence(worldIds: number[]) {
    App.wus = worldIds;
  }

  static getWorldUpdateSequence(): number[] {
    return App.wus;
  }

  static onUpdate() {}

  static run() {
    requestAnimationFrame(App.run);
    App.onUpdate();
    for (let i = 0, l = App.wus.length; i < l; i++) {
      if (!App.ss[App.wus[i]]) continue;
      App.ws[App.wus[i]].update(App.ss[App.wus[i]]);
    }
    updateTime(App.time);
    updateKeyboard(App.keys);
    updatePointers(App.pointers);
  }
}
