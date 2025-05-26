import { ObjectPool } from "./pool.ts";

export type entityT = number;

export class EntityManager {
  static nextId = 0;
  static pool = new ObjectPool<entityT>(() => EntityManager.nextId++);

  static add(): entityT {
    return EntityManager.pool.addObj();
  }

  static findIndex(entity: entityT): number {
    return EntityManager.pool.findIndex(entity);
  }

  static delete(index: number): entityT {
    return EntityManager.pool.removeObj(index);
  }
}
