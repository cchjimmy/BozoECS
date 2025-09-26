import { ComponentManager } from "./component.ts";
import { EntityManager, entityT } from "./entity.ts";

export type queryT = Partial<Record<"and" | "or" | "not", object[]>>;

export class World {
  private static indexMap: Map<object, Map<number, number>> = new Map();
  private static maskMap: Map<number, number> = new Map();
  private static archetypeMap: Map<number, Set<entityT>> = new Map();
  private static worlds: World[] = [];

  private localEntities: Set<entityT> = new Set();
  timeMilli = 0;
  dtMilli = 0;

  constructor() {
    World.worlds.push(this);
  }

  static createEntity(): entityT {
    const entity = EntityManager.add();
    World.maskMap.set(entity, 0);
    World.getArchetype(0).add(entity);
    return entity;
  }

  private static getArchetype(mask: number): Set<entityT> {
    const a = World.archetypeMap.get(mask) ?? new Set();
    World.archetypeMap.set(mask, a);
    return a;
  }

  static deleteEntity(entity: entityT) {
    for (let i = 0, l = World.worlds.length; i < l; i++) {
      World.worlds[i].removeEntity(entity);
    }
    const types = ComponentManager.types();
    const mask = World.maskMap.get(entity) as number;
    for (let i = 0, l = types.length; i < l; i++) {
      if (!(mask & (1 << i))) continue;
      World.removeComponent(entity, types[i]);
    }
    EntityManager.delete(EntityManager.findIndex(entity));
  }

  addEntity(entity: entityT = World.createEntity()): entityT {
    this.localEntities.add(entity);
    return entity;
  }

  removeEntity(entity: entityT) {
    this.localEntities.delete(entity);
  }

  entityExists(entity: entityT): boolean {
    return this.localEntities.has(entity);
  }

  static registerComponent<T extends object>(component: T): typeof World {
    if (World.indexMap.has(component)) return World;
    ComponentManager.register(component);
    World.indexMap.set(component, new Map());
    return World;
  }

  static hasComponent<T extends object>(
    entity: entityT,
    component: T,
  ): boolean {
    return !!(
      (World.maskMap.get(entity) as number) &
      (1 << ComponentManager.getId(component))
    );
  }

  static addComponent<T extends object>(
    entity: entityT,
    component: T,
    values: Partial<T> = {},
  ): T {
    World.registerComponent(component);
    let mask = World.maskMap.get(entity) as number;
    const compId = ComponentManager.getId(component);
    if ((mask & (1 << compId)) != 0) {
      throw new Error(`Entity ${entity} already had that component.`);
    }
    World.getArchetype(mask).delete(entity);
    mask |= 1 << compId;
    World.maskMap.set(entity, mask);
    World.getArchetype(mask).add(entity);
    const idx = ComponentManager.len(component);
    (World.indexMap.get(component) as Map<number, number>).set(entity, idx);
    return Object.assign(ComponentManager.add(component), values);
  }

  static removeComponent<T extends object>(entity: entityT, component: T): T {
    World.registerComponent(component);
    let mask = World.maskMap.get(entity) as number;
    const compId = ComponentManager.getId(component);
    if ((mask & (1 << compId)) == 0) {
      throw new Error(`Entity ${entity} does not have that component.`);
    }
    World.getArchetype(mask).delete(entity);
    mask &= ~(1 << compId);
    World.maskMap.set(entity, mask);
    World.getArchetype(mask).add(entity);
    const indices = World.indexMap.get(component) as Map<number, number>;
    const entityIdx = indices.get(entity) as number;
    const removed = ComponentManager.delete(component, entityIdx);
    const backEntity = indices.keys().toArray().at(-1) ?? -1;
    indices.set(backEntity, entityIdx);
    indices.delete(entity);
    return removed;
  }

  static getComponent<T extends object>(entity: entityT, component: T): T {
    return ComponentManager.get(
      component,
      (World.indexMap.get(component) as Map<number, number>).get(
        entity,
      ) as number,
    );
  }

  update(...fns: ((world: World) => void)[]) {
    for (let i = 0, l = fns.length; i < l; i++) fns[i](this);
    this.dtMilli = performance.now() - this.timeMilli;
    this.timeMilli += this.dtMilli;
  }

  query(query: queryT): entityT[] {
    let andMask = 0,
      orMask = 0,
      notMask = 0;
    if (query.and) {
      for (let i = 0, l = query.and.length; i < l; i++) {
        andMask |= 1 << ComponentManager.getId(query.and[i]);
      }
    }
    if (query.or) {
      for (let i = 0, l = query.or.length; i < l; i++) {
        orMask |= 1 << ComponentManager.getId(query.or[i]);
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
      if (
        set.size > 0 &&
        (a & andMask) == andMask &&
        (a | orMask) > 0 &&
        (a & notMask) == 0
      ) {
        res.push(...this.localEntities.intersection(set));
      }
    }
    return res;
  }

  entityCount(): number {
    return this.localEntities.size;
  }
}
