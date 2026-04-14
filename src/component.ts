import { ObjectPool } from "./pool.ts";

export class ComponentManager {
  private _poolMap: Map<object, ObjectPool<object>> = new Map();
  private _compId: Map<object, number> = new Map();

  register<T extends object>(component: T): void {
    if (this._poolMap.has(component)) return;
    this._poolMap.set(component, new ObjectPool<T>(component));
    this._compId.set(component, this._compId.size);
  }

  add<T extends object>(component: T): T {
    return this._getPool(component).get();
  }

  remove<T extends object>(component: T, instance: T): void {
    this._getPool(component).release(instance);
  }

  size<T extends object>(component: T): number {
    return this._getPool(component).size();
  }

  copy<T extends object>(component: T, values: Partial<T> = component): T {
    return this._getPool(component).copy(values);
  }

  clean(): void {
    for (const entry of this._poolMap) entry[1].clean();
  }

  getId<T extends object>(component: T): number {
    return this._compId.get(component) ?? -1;
  }

  private _getPool<T extends object>(component: T): ObjectPool<T> {
    return this._poolMap.get(component) as ObjectPool<T>;
  }
}
