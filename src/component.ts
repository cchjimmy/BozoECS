import { ObjectPoolMap } from "./pool.ts";
import { entityT } from "./entity.ts";

export class ComponentManager {
  private poolMap: Map<object, ObjectPoolMap<entityT, object>> = new Map();
  private idMap: Map<object, number> = new Map();

  register<T extends object>(component: T): void {
    if (this.poolMap.has(component)) return;
    this.idMap.set(component, this.idMap.size);
    this.poolMap.set(
      component,
      new ObjectPoolMap<entityT, T>(() => ({ ...component })),
    );
  }

  getId<T extends object>(component: T): number {
    const mask = this.idMap.get(component);
    if (mask != undefined) return mask;
    this.register(component);
    return this.idMap.get(component) as number;
  }

  add<T extends object>(entity: entityT, component: T): T {
    return Object.assign(
      (this.poolMap.get(component) as ObjectPoolMap<entityT, T>).add(entity),
      component,
    );
  }

  remove<T extends object>(entity: entityT, component: T): void {
    (this.poolMap.get(component) as ObjectPoolMap<entityT, T>).remove(entity);
  }

  has<T extends object>(entity: entityT, component: T): boolean {
    return (
      this.poolMap.has(component) &&
      (this.poolMap.get(component) as ObjectPoolMap<entityT, T>).has(entity)
    );
  }

  get<T extends object>(entity: entityT, component: T): T {
    return (this.poolMap.get(component) as ObjectPoolMap<entityT, T>).get(
      entity,
    );
  }

  size<T extends object>(component: T): number {
    return (this.poolMap.get(component) as ObjectPoolMap<entityT, T>).size();
  }

  delete(entity: entityT): void {
    for (const entry of this.poolMap.entries()) entry[1].remove(entity);
  }

  copy(src: entityT, dest: entityT): void {
    for (const entry of this.poolMap.entries())
      entry[1].has(src) && Object.assign(entry[1].add(dest), entry[1].get(src));
  }

  clean(): void {
    for (const entry of this.poolMap.entries()) entry[1].clean();
  }
}
