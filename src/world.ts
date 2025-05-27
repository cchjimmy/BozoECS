import { ComponentManager } from "./component.ts";
import { EntityManager, entityT } from "./entity.ts";

export type queryT = Partial<
  Record<"and" | "or" | "not", object[]>
>;

export class World {
  private static indexMap: Map<object, Map<number, number>> = new Map();
  private static maskMap: Map<number, number> = new Map();
  private static archetypeMap: Map<number, Set<entityT>> = new Map();
  private static worlds: World[] = [];
  private static removeMap: Map<number, (_: entityT) => object> = new Map();
  private static ownerMap: Map<object, Map<number, number>> = new Map();

  timeMilli = 0;
  dtMilli = 0;
  localEntities: Set<entityT> = new Set();

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
    const a = World.archetypeMap.get(mask);
    if (a == undefined) {
      const set: Set<entityT> = new Set();
      World.archetypeMap.set(mask, set);
      return set;
    }
    return a;
  }

  static deleteEntity(entity: entityT) {
    for (let i = 0, l = World.worlds.length; i < l; i++) {
      World.worlds[i].removeEntity(entity);
    }
    const types = ComponentManager.types();
    for (let i = 0, l = ComponentManager.typeLen(); i < l; i++) {
      if (!(World.getMask(entity) & 1 << i)) continue;
      World.getRemoveFn(i)(entity);
      const indices = World.getIndices(types[i]);
      const owners = World.getOwners(types[i]);
      const backEntity = World.getOwner(owners, owners.size - 1);
      const entityIdx = World.getIndex(indices, entity);
      owners.set(entityIdx, backEntity);
      indices.set(backEntity, entityIdx);
    }
    World.getArchetype(World.getMask(entity)).delete(entity);
    World.maskMap.set(entity, 0);
    EntityManager.delete(EntityManager.findIndex(entity));
  }

  private static getRemoveFn(compId: number) {
    const removeFn = World.removeMap.get(compId);
    if (removeFn == undefined) throw new Error("Component not registered.");
    return removeFn;
  }

  addEntity(entity?: entityT): entityT {
    entity ??= World.createEntity();
    this.localEntities.add(entity);
    return entity;
  }

  removeEntity(entity: entityT) {
    this.localEntities.delete(entity);
  }

  entityExists(entity: entityT): boolean {
    return this.localEntities.has(entity);
  }

  static componentExists<T extends object>(component: T) {
    if (!World.indexMap.has(component)) World.registerComponent(component);
  }

  static registerComponent<T extends object>(
    component: T,
  ): typeof World {
    ComponentManager.register(component);
    World.indexMap.set(component, new Map());
    World.removeMap.set(
      ComponentManager.getId(component),
      (e: entityT) =>
        ComponentManager.delete(
          component,
          World.getIndex(World.getIndices(component), e),
        ),
    );
    World.ownerMap.set(component, new Map());
    return World;
  }

  static hasComponent<T extends object>(
    entity: entityT,
    component: T,
  ): boolean {
    return (World.getMask(entity) &
      1 << ComponentManager.getId(component)) > 0;
  }

  static addComponent<T extends object>(
    entity: entityT,
    component: T,
  ): T {
    World.componentExists(component);
    let mask = World.getMask(entity);
    const compId = ComponentManager.getId(component);
    if ((mask & 1 << compId) != 0) {
      throw new Error(`Entity ${entity} already had that component.`);
    }
    World.getArchetype(mask).delete(entity);
    mask |= 1 << compId;
    World.maskMap.set(entity, mask);
    World.getArchetype(mask).add(entity);
    const idx = ComponentManager.len(component);
    World.getIndices(component).set(entity, idx);
    World.getOwners(component).set(idx, entity);
    return ComponentManager.add(component);
  }

  private static getIndices<T extends object>(component: T) {
    const indices = World.indexMap.get(component);
    if (indices == undefined) throw new Error("Component not registered.");
    return indices;
  }

  private static getIndex(
    indices: Map<number, number>,
    entity: entityT,
  ) {
    const index = indices.get(entity);
    if (index == undefined) throw new Error(`Entity ${entity} does not exist.`);
    return index;
  }

  private static getOwners<T extends object>(component: T) {
    const owners = World.ownerMap.get(component);
    if (owners == undefined) throw new Error("Component not registered.");
    return owners;
  }

  private static getOwner(owners: Map<number, number>, index: number) {
    const owner = owners.get(index);
    if (owner == undefined) throw new Error("Owner not found.");
    return owner;
  }

  static removeComponent<T extends object>(
    entity: entityT,
    component: T,
  ): T {
    World.componentExists(component);
    let mask = World.getMask(entity);
    const compId = ComponentManager.getId(component);
    if ((mask & 1 << compId) == 0) {
      throw new Error(
        `Entity ${entity} does not have that component.`,
      );
    }
    World.getArchetype(mask).delete(entity);
    mask &= ~(1 << compId);
    World.maskMap.set(entity, mask);
    World.getArchetype(mask).add(entity);
    const indices = World.getIndices(component);
    const owners = World.getOwners(component);
    const entityIdx = World.getIndex(indices, entity);
    const removed = ComponentManager.delete(component, entityIdx);
    const backEntity = World.getOwner(owners, owners.size - 1);
    owners.set(entityIdx, backEntity);
    indices.set(backEntity, entityIdx);
    return removed;
  }

  private static getMask(e: entityT): number {
    return World.maskMap.get(e) ?? -1;
  }

  static getComponent<T extends object>(
    entity: entityT,
    component: T,
  ): T {
    if (!World.hasComponent(entity, component)) {
      throw new Error(`Entity ${entity} does not have that component.`);
    }
    return ComponentManager.get(
      component,
      World.getIndex(World.getIndices(component), entity),
    );
  }

  update(...fns: ((world: World) => void)[]) {
    for (let i = 0, l = fns.length; i < l; i++) fns[i](this);
    this.dtMilli = performance.now() - this.timeMilli;
    this.timeMilli += this.dtMilli;
  }

  query(query: queryT): entityT[] {
    let andMask = 0, orMask = 0, notMask = 0;
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
        i = 0,
        a = archetypes[i];
      i < l;
      i++, a = archetypes[i]
    ) {
      if ((a & andMask) == andMask && (a | orMask) > 0 && (a & notMask) == 0) {
        res.push(...this.localEntities.intersection(World.getArchetype(a)));
      }
    }
    return res;
  }

  entityCount(): number {
    return this.localEntities.size;
  }
}
