import { ObjectPoolMap } from "./pool.ts";
import { entityT } from "./entity.ts";

export class ComponentManager {
  private pools: Map<object, ObjectPoolMap<entityT, object>> = new Map();
  private idMap: Map<object, number> = new Map();

  register<T extends object>(component: T): void {
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

  remove<T extends object>(entity: entityT, component: T): void {
    (this.pools.get(component) as ObjectPoolMap<entityT, T>).remove(entity);
  }

  has<T extends object>(entity: entityT, component: T): boolean {
    return (
      this.pools.has(component) &&
      (this.pools.get(component) as ObjectPoolMap<entityT, T>).has(entity)
    );
  }

  get<T extends object>(entity: entityT, component: T): T {
    return (this.pools.get(component) as ObjectPoolMap<entityT, T>).get(entity);
  }

  size<T extends object>(component: T): number {
    return (this.pools.get(component) as ObjectPoolMap<entityT, T>).size();
  }

  delete(entity: entityT): void {
    for (const entry of this.pools) {
      entry[1].remove(entity);
    }
  }

  copy(src: entityT, dest: entityT): void {
    for (const entry of this.pools) {
      entry[1].has(src) && Object.assign(entry[1].add(dest), entry[1].get(src));
    }
  }

  clean() {
    for (const entry of this.pools) {
      entry[1].clean();
    }
  }
}
