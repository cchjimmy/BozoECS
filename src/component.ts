import { ObjectPoolMap } from "./pool.ts";
import { entityT, newEntity } from "./entity.ts";

export class ComponentManager {
  private static pools: Map<object, unknown> = new Map();
  private static idMap: Map<object, number> = new Map();

  static register<T extends object>(component: T) {
    if (ComponentManager.pools.has(component)) return;
    ComponentManager.idMap.set(component, ComponentManager.idMap.size);
    ComponentManager.pools.set(
      component,
      new ObjectPoolMap<entityT, T>(() => ({ ...component })),
    );
  }

  static getId<T extends object>(component: T): number {
    return ComponentManager.idMap.get(component) ?? -1;
  }

  static add<T extends object>(entity: entityT, component: T): T {
    return Object.assign(
      (ComponentManager.pools.get(component) as ObjectPoolMap<entityT, T>).add(
        entity,
      ),
      component,
    );
  }

  static remove<T extends object>(entity: entityT, component: T): boolean {
    return (
      ComponentManager.pools.get(component) as ObjectPoolMap<entityT, T>
    ).remove(entity);
  }

  static get<T extends object>(entity: entityT, component: T): T {
    return (
      ComponentManager.pools.get(component) as ObjectPoolMap<entityT, T>
    ).get(entity);
  }

  static len<T extends object>(component: T): number {
    return (
      ComponentManager.pools.get(component) as ObjectPoolMap<entityT, T>
    ).len();
  }

  static delete(entity: entityT) {
    for (const entry of this.pools) {
      const p = entry[1] as ObjectPoolMap<entityT, object>;
      p.has(entity) && p.remove(entity);
    }
  }

  static copy(entity: entityT): entityT {
    const copied = newEntity();
    for (const entry of this.pools) {
      const p = entry[1] as ObjectPoolMap<entityT, object>;
      p.has(entity) && Object.assign(p.add(copied), p.get(entity));
    }
    return copied;
  }
}
