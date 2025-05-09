import { ObjectPool } from "./pool.ts";

export type entityT = number;

export class EntityManager {
  nextId = 0;
  pool = new ObjectPool<entityT>(() => this.nextId++);

  add(): entityT {
    return this.pool.addObj();
  }

  findIndex(entity: entityT): number {
    return this.pool.findIndex(entity);
  }

  delete(index: number): entityT {
    return this.pool.removeObj(index);
  }
}
