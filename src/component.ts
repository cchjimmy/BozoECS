import { ObjectPoolMap } from "./pool.ts";
import { entityT, newEntity } from "./entity.ts";

export class ComponentManager {
  private pools: Map<object, unknown> = new Map();
  private idMap: Map<object, number> = new Map();

  register<T extends object>(component: T) {
    if (this.pools.has(component)) return;
    this.idMap.set(component, this.idMap.size);
    this.pools.set(
      component,
      new ObjectPoolMap<entityT, T>(() => ({ ...component })),
    );
  }

  getId<T extends object>(component: T): number {
    return this.idMap.get(component) ?? -1;
  }

  add<T extends object>(entity: entityT, component: T): T {
    return Object.assign(
      (this.pools.get(component) as ObjectPoolMap<entityT, T>).add(entity),
      component,
    );
  }

  remove<T extends object>(entity: entityT, component: T): boolean {
    return (this.pools.get(component) as ObjectPoolMap<entityT, T>).remove(
      entity,
    );
  }

  get<T extends object>(entity: entityT, component: T): T {
    return (this.pools.get(component) as ObjectPoolMap<entityT, T>).get(entity);
  }

  len<T extends object>(component: T): number {
    return (this.pools.get(component) as ObjectPoolMap<entityT, T>).len();
  }

  delete(entity: entityT) {
    for (const p of this.pools.values()) {
      const pool = p as ObjectPoolMap<entityT, object>;
      pool.remove(entity);
    }
  }

  copy(srcEntity: entityT, destEntity: entityT) {
    for (const p of this.pools.values()) {
      const pool = p as ObjectPoolMap<entityT, object>;
      pool.has(srcEntity) &&
        Object.assign(pool.add(destEntity), pool.get(srcEntity));
    }
  }

  clean() {
    for (const p of this.pools.values()) {
      const pool = p as ObjectPoolMap<entityT, object>;
      pool.clean();
    }
  }
}
