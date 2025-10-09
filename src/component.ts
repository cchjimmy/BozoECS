import { ObjectPoolMap } from "./pool.ts";
import { entityT } from "./entity.ts";

export class ComponentManager {
  private static pools: Map<object, unknown> = new Map();
  private static idMap: Map<object, number> = new Map();

  static register<T extends object>(component: T) {
    if (ComponentManager.pools.has(component)) return;
    ComponentManager.idMap.set(component, ComponentManager.idMap.size);
    ComponentManager.pools.set(
      component,
      new ObjectPoolMap<T>(() => ({ ...component })),
    );
  }

  static getId<T extends object>(component: T): number {
    return ComponentManager.idMap.get(component) ?? -1;
  }

  static add<T extends object>(key: entityT, component: T): T {
    return Object.assign(
      (ComponentManager.pools.get(component) as ObjectPoolMap<T>).addObj(key),
      component,
    );
  }

  static delete<T extends object>(key: entityT, component: T): boolean {
    return (
      ComponentManager.pools.get(component) as ObjectPoolMap<T>
    ).removeObj(key);
  }

  static get<T extends object>(key: entityT, component: T): T {
    return (ComponentManager.pools.get(component) as ObjectPoolMap<T>).getObj(
      key,
    );
  }

  static len<T extends object>(component: T): number {
    return (ComponentManager.pools.get(component) as ObjectPoolMap<T>).len();
  }

  static typeLen(): number {
    return ComponentManager.pools.size;
  }

  static types(): object[] {
    return ComponentManager.pools.keys().toArray();
  }
}
