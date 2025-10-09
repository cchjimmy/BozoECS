import { ComponentManager } from "./component.ts";
import { entityT } from "./entity.ts";

export type queryT = Partial<Record<"and" | "not", object[]>>;

export class World {
  private static maskMap: Map<number, number> = new Map();
  private static archetypeMap: Map<number, Set<entityT>> = new Map();
  private static worlds: World[] = [];
  private static entitiesToDelete: entityT[] = [];

  private localEntities: Set<entityT> = new Set();

  constructor() {
    World.worlds.push(this);
  }

  static createEntity(): entityT {
    const entity = Math.random();
    World.maskMap.set(entity, 0);
    World.getArchetype(0).add(entity);
    return entity;
  }

  static copyEntity(entity: entityT): entityT {
    const copy = Math.random();
    const compTypes = ComponentManager.types();
    const mask = this.maskMap.get(entity) ?? 0;
    World.maskMap.set(copy, mask);
    World.getArchetype(mask).add(copy);
    for (let i = 0, l = compTypes.length; i < l; i++) {
      if (!(mask & (1 << i))) continue;
      Object.assign(
        ComponentManager.add(copy, compTypes[i]),
        ComponentManager.get(entity, compTypes[i]),
      );
    }
    return copy;
  }

  private static getArchetype(mask: number): Set<entityT> {
    const a = World.archetypeMap.get(mask) ?? new Set();
    World.archetypeMap.set(mask, a);
    return a;
  }

  static deleteEntity(entity: entityT) {
    World.entitiesToDelete.push(entity);
  }

  addEntity(entity: entityT = World.createEntity()): entityT {
    this.localEntities.add(entity);
    return entity;
  }

  removeEntity(entity: entityT) {
    this.localEntities.delete(entity);
  }

  static registerComponent<T extends object>(component: T): typeof World {
    ComponentManager.register(component);
    return World;
  }

  static hasComponent<T extends object>(
    entity: entityT,
    component: T,
  ): boolean {
    return (
      ((World.maskMap.get(entity) ?? 0) &
        (1 << ComponentManager.getId(component))) >
      0
    );
  }

  static addComponent<T extends object>(
    entity: entityT,
    component: T,
    values: Partial<T> = component,
  ): T {
    World.registerComponent(component);
    let mask = World.maskMap.get(entity) ?? 0;
    const compId = ComponentManager.getId(component);
    if ((mask & (1 << compId)) != 0) {
      return Object.assign(ComponentManager.get(entity, component), values);
    }
    World.getArchetype(mask).delete(entity);
    mask |= 1 << compId;
    World.maskMap.set(entity, mask);
    World.getArchetype(mask).add(entity);
    return Object.assign(ComponentManager.add(entity, component), values);
  }

  static removeComponent<T extends object>(
    entity: entityT,
    component: T,
  ): boolean {
    World.registerComponent(component);
    let mask = World.maskMap.get(entity) ?? 0;
    const compId = ComponentManager.getId(component);
    if ((mask & (1 << compId)) == 0) return false;
    World.getArchetype(mask).delete(entity);
    mask &= ~(1 << compId);
    World.maskMap.set(entity, mask);
    World.getArchetype(mask).add(entity);
    return ComponentManager.delete(entity, component);
  }

  static getComponent<T extends object>(entity: entityT, component: T): T {
    return ComponentManager.get(entity, component);
  }

  update(...fns: ((world: World) => void)[]) {
    for (let i = 0, l = fns.length; i < l; i++) fns[i](this);
    while (World.entitiesToDelete.length) {
      const entity = World.entitiesToDelete.pop() as entityT;
      for (let i = 0, l = World.worlds.length; i < l; i++) {
        World.worlds[i].localEntities.delete(entity);
      }
      const types = ComponentManager.types();
      const mask = World.maskMap.get(entity) ?? 0;
      World.getArchetype(mask).delete(entity);
      for (let i = 0, l = types.length; i < l; i++) {
        if (!(mask & (1 << i))) continue;
        ComponentManager.delete(entity, types[i]);
      }
    }
  }

  query(query: queryT): entityT[] {
    let andMask = 0,
      notMask = 0;
    if (query.and) {
      for (let i = 0, l = query.and.length; i < l; i++) {
        andMask |= 1 << ComponentManager.getId(query.and[i]);
      }
    }
    if (query.not) {
      for (let i = 0, l = query.not.length; i < l; i++) {
        notMask |= 1 << ComponentManager.getId(query.not[i]);
      }
    }
    const res = [];
    for (
      let archetypes = World.archetypeMap.keys().toArray(),
        l = archetypes.length,
        i = 0;
      i < l;
      i++
    ) {
      const a = archetypes[i];
      const set = World.getArchetype(a);
      if (set.size == 0) continue;
      (a & andMask) == andMask && (a & notMask) == 0 && res.push(...set);
    }
    return [...this.localEntities.intersection(new Set(res))];
  }

  entityCount(): number {
    return this.localEntities.size;
  }
}
