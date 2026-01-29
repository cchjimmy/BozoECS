import { ComponentManager } from "./component.ts";
import { newEntity, type entityT } from "./entity.ts";

export type queryT = Partial<Record<"and" | "not", object[]>>;

export type systemT = (world: World) => void;

export class World {
  private compEntityMap: Map<number, Set<entityT>> = new Map();
  private compManager = new ComponentManager();
  private entitySet: Set<entityT> = new Set();

  addEntity(entity: entityT = newEntity()): entityT {
    this.entitySet.add(entity);
    return entity;
  }

  copyEntity(src: entityT, dest: entityT = newEntity()): entityT {
    this.compManager.copy(src, dest);
    for (const entry of this.compEntityMap) {
      if (!entry[1].has(src)) continue;
      entry[1].add(dest);
    }
    this.entitySet.add(dest);
    return dest;
  }

  private getCompEntityMap(compId: number): Set<entityT> {
    const a = this.compEntityMap.get(compId) ?? new Set();
    this.compEntityMap.set(compId, a);
    return a;
  }

  deleteEntity(entity: entityT) {
    this.compManager.delete(entity);
    for (const entry of this.compEntityMap) {
      entry[1].delete(entity);
    }
    this.entitySet.delete(entity);
  }

  registerComponent<T extends object>(component: T): World {
    this.compManager.register(component);
    return this;
  }

  hasComponent<T extends object>(entity: entityT, component: T): boolean {
    return this.compManager.has(entity, component);
  }

  addComponent<T extends object>(
    entity: entityT,
    component: T,
    values: Partial<T> = component,
  ): T {
    this.compManager.register(component);
    const cem = this.getCompEntityMap(this.compManager.getId(component));
    if (cem.has(entity))
      return Object.assign(this.compManager.get(entity, component), values);
    cem.add(entity);
    return Object.assign(this.compManager.add(entity, component), values);
  }

  removeComponent<T extends object>(entity: entityT, component: T): void {
    this.compManager.register(component);
    this.getCompEntityMap(this.compManager.getId(component)).delete(entity);
    this.compManager.remove(entity, component);
  }

  getComponent<T extends object>(entity: entityT, component: T): T {
    return this.compManager.get(entity, component);
  }

  update(...fns: systemT[]) {
    for (let i = 0, l = fns.length; i < l; i++) fns[i](this);
  }

  cleanObjectPools(): void {
    this.compManager.clean();
  }

  query(query: queryT): entityT[] {
    let res: Set<entityT> = this.entitySet;
    if (query.and) {
      for (const comp of query.and) {
        res = res.intersection(
          this.getCompEntityMap(this.compManager.getId(comp)),
        );
      }
    }
    if (query.not) {
      for (const comp of query.not) {
        res = res.difference(
          this.getCompEntityMap(this.compManager.getId(comp)),
        );
      }
    }
    return [...res];
  }

  entityCount(): number {
    return this.entitySet.size;
  }
}
