import { ComponentManager } from "./component.ts";
import { newEntity, type entityT } from "./entity.ts";

export type queryT = Partial<Record<"and" | "not", object[]>>;

export class World {
  private maskMap: Map<number, number> = new Map();
  private archetypeMap: Map<number, Set<entityT>> = new Map();
  private entitiesToDelete: entityT[] = [];
  private compManager = new ComponentManager();
  private frameCount = 0;
  cleanUpMinutes = 5;

  constructor(cleanUpMinutes = 5) {
    this.cleanUpMinutes = cleanUpMinutes;
  }

  addEntity(entity: entityT = newEntity()): entityT {
    this.maskMap.set(entity, 0);
    this.getArchetype(0).add(entity);
    return entity;
  }

  copyEntity(src: entityT, dest: entityT = newEntity()): entityT {
    this.compManager.copy(src, dest);
    const mask = this.maskMap.get(src) ?? 0;
    this.maskMap.set(dest, mask);
    this.getArchetype(mask).add(dest);
    return dest;
  }

  private getArchetype(mask: number): Set<entityT> {
    const a = this.archetypeMap.get(mask) ?? new Set();
    this.archetypeMap.set(mask, a);
    return a;
  }

  deleteEntity(entity: entityT) {
    this.entitiesToDelete.push(entity);
  }

  registerComponent<T extends object>(component: T): World {
    this.compManager.register(component);
    return this;
  }

  hasComponent<T extends object>(entity: entityT, component: T): boolean {
    return (
      ((this.maskMap.get(entity) ?? 0) &
        (1 << this.compManager.getId(component))) >
      0
    );
  }

  addComponent<T extends object>(
    entity: entityT,
    component: T,
    values: Partial<T> = component,
  ): T {
    this.registerComponent(component);
    let mask = this.maskMap.get(entity) ?? 0;
    const compId = this.compManager.getId(component);
    if ((mask & (1 << compId)) != 0) {
      return Object.assign(this.compManager.get(entity, component), values);
    }
    this.getArchetype(mask).delete(entity);
    mask |= 1 << compId;
    this.maskMap.set(entity, mask);
    this.getArchetype(mask).add(entity);
    return Object.assign(this.compManager.add(entity, component), values);
  }

  removeComponent<T extends object>(entity: entityT, component: T): boolean {
    this.registerComponent(component);
    let mask = this.maskMap.get(entity) ?? 0;
    const compId = this.compManager.getId(component);
    if ((mask & (1 << compId)) == 0) return false;
    this.getArchetype(mask).delete(entity);
    mask &= ~(1 << compId);
    this.maskMap.set(entity, mask);
    this.getArchetype(mask).add(entity);
    return this.compManager.remove(entity, component);
  }

  getComponent<T extends object>(entity: entityT, component: T): T {
    return this.compManager.get(entity, component);
  }

  update(...fns: ((world: World) => void)[]) {
    for (let i = 0, l = fns.length; i < l; i++) fns[i](this);
    this.commitEntityDeletion();
    this.frameCount % (this.cleanUpMinutes * 60 * 60) == 0 &&
      this.cleanObjectPools();
    this.frameCount++;
  }

  commitEntityDeletion() {
    while (this.entitiesToDelete.length) {
      const entity = this.entitiesToDelete.pop() as entityT;
      this.compManager.delete(entity);
      const mask = this.maskMap.get(entity) ?? 0;
      this.maskMap.delete(entity);
      this.getArchetype(mask).delete(entity);
    }
  }

  cleanObjectPools() {
    this.compManager.clean();
  }

  query(query: queryT): entityT[] {
    let andMask = 0,
      notMask = 0;
    if (query.and) {
      for (let i = 0, l = query.and.length; i < l; i++) {
        andMask |= 1 << this.compManager.getId(query.and[i]);
      }
    }
    if (query.not) {
      for (let i = 0, l = query.not.length; i < l; i++) {
        notMask |= 1 << this.compManager.getId(query.not[i]);
      }
    }
    const res: entityT[] = [];
    this.archetypeMap.forEach((_v, k) => {
      const set = this.getArchetype(k);
      set.size > 0 &&
        (k & andMask) == andMask &&
        (k & notMask) == 0 &&
        res.push(...set);
    });
    return [...new Set(res)];
  }

  entityCount(): number {
    return this.maskMap.size;
  }
}
