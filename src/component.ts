import { ObjectPool } from "./pool.ts";

export class ComponentManager {
  private static pools: Map<object, any> = new Map();
  private static idMap: Map<object, number> = new Map();

  static register<T extends object>(component: T) {
    ComponentManager.idMap.set(component, ComponentManager.idMap.size);
    ComponentManager.pools.set(
      component,
      new ObjectPool<T>(() => Object.assign({}, component)),
    );
  }

  static getId<T extends object>(component: T): number {
    return ComponentManager.idMap.get(component) ?? -1;
  }

  static add<T extends object>(component: T): T {
    return (ComponentManager.pools.get(component) as ObjectPool<T>).addObj();
  }

  static delete<T extends object>(
    component: T,
    index: number,
  ): T {
    return (ComponentManager.pools.get(component) as ObjectPool<T>).removeObj(
      index,
    );
  }

  static get<T extends object>(
    component: T,
    index: number,
  ): T {
    return (ComponentManager.pools.get(component) as ObjectPool<T>).getObj(
      index,
    );
  }

  static len<T extends object>(component: T): number {
    return (ComponentManager.pools.get(component) as ObjectPool<T>).len();
  }

  static typeLen(): number {
    return ComponentManager.pools.size;
  }

  static types(): object[] {
    return ComponentManager.pools.keys().toArray();
  }
}
