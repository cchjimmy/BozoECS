import { ComponentManager } from "./component.ts";
import { newEntity, type entityT } from "./entity.ts";

export type queryT = Partial<Record<"and" | "not", object[]>>;

export type systemT = (world: World) => void;

export class World {
  private maskMap: Map<entityT, bigint> = new Map();
  private archetypeMap: Map<bigint, Set<entityT>> = new Map();
  private compManager = new ComponentManager();

  addEntity(entity: entityT = newEntity()): entityT {
    if (this.maskMap.has(entity)) return entity;
    this.maskMap.set(entity, 0n);
    return entity;
  }

  copyEntity(src: entityT, dest: entityT = newEntity()): entityT {
    this.compManager.copy(src, dest);
    const mask = this.maskMap.get(src) ?? 0n;
    this.maskMap.set(dest, mask);
    this.getArchetype(mask).add(dest);
    return dest;
  }

  private getArchetype(mask: bigint): Set<entityT> {
    const a = this.archetypeMap.get(mask) ?? new Set();
    this.archetypeMap.set(mask, a);
    return a;
  }

  deleteEntity(entity: entityT) {
    this.compManager.delete(entity);
    this.getArchetype(this.maskMap.get(entity) ?? 0n).delete(entity);
    this.maskMap.delete(entity);
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
    let mask = this.maskMap.get(entity) ?? 0n;
    const compMask = this.compManager.getMask(component);
    if (mask & compMask)
      return Object.assign(this.compManager.get(entity, component), values);
    this.getArchetype(mask).delete(entity);
    mask ^= compMask;
    this.maskMap.set(entity, mask);
    this.getArchetype(mask).add(entity);
    return Object.assign(this.compManager.add(entity, component), values);
  }

  removeComponent<T extends object>(entity: entityT, component: T): void {
    this.compManager.register(component);
    let mask = this.maskMap.get(entity) ?? 0n;
    const compMask = this.compManager.getMask(component);
    if ((mask & compMask) ^ compMask) return;
    this.compManager.remove(entity, component);
    this.getArchetype(mask).delete(entity);
    mask ^= compMask;
    this.maskMap.set(entity, mask);
    this.getArchetype(mask).add(entity);
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
    let andMask = 0n,
      notMask = 0n;
    if (query.and) {
      for (let i = 0, l = query.and.length; i < l; i++)
        andMask |= this.compManager.getMask(query.and[i]);
    }
    if (query.not) {
      for (let i = 0, l = query.not.length; i < l; i++)
        notMask |= this.compManager.getMask(query.not[i]);
    }
    const res: entityT[] = [];
    for (const entry of this.archetypeMap.entries()) {
      entry[1].size > 0 &&
        (entry[0] & andMask) == andMask &&
        (entry[0] & notMask) == 0n &&
        res.push(...entry[1]);
    }
    return res;
  }

  entityCount(): number {
    return this.maskMap.size;
  }
}
