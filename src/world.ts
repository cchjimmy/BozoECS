import { Component, ComponentManager } from "./component.ts";
import { EntityManager, entityT } from "./entity.ts";

export class World {
  indices: number[][];
  components: ComponentManager;
  entities: EntityManager;
  entityMasks: number[];
  archetypes: Record<number, Set<entityT>>;

  constructor() {
    this.indices = [];
    this.components = new ComponentManager();
    this.entities = new EntityManager();
    this.entityMasks = [];
    this.archetypes = { 0: new Set() };
  }

  addEntity(): entityT {
    const entity = this.entities.add();
    this.indices[entity] = [];
    this.entityMasks[entity] = 0;
    this.archetypes[0].add(entity);
    return entity;
  }

  removeEntity(index: number): entityT {
    const entity = this.entities.pool.active[index];
    for (let i = 0, l = this.components.pools.length; i < l; i++) {
      if (!(this.entityMasks[entity] & 1 << i)) continue;
      this.components.pools[i].removeObj(this.indices[entity][i]);
    }
    this.archetypes[0].delete(entity);
    return this.entities.delete(index);
  }

  entityExists(entity: entityT) {
    if (!this.indices[entity]) {
      throw new Error(`Entity ${entity} does not exist.`);
    }
  }

  componentExists<T extends typeof Component>(component: T) {
    if (!this.components.isRegistered(component)) {
      throw new Error(
        `Component ${component.name} is not registered.`,
      );
    }
  }

  registerComponent<T extends typeof Component>(component: T): this {
    this.components.register(component);
    return this;
  }

  hasComponent<T extends typeof Component>(
    entity: entityT,
    component: T,
  ): boolean {
    return (this.entityMasks[entity] & 1 << component.id) > 0;
  }

  addComponent<T extends typeof Component>(
    entity: entityT,
    component: T,
  ): InstanceType<T> {
    this.entityExists(entity);
    this.componentExists(component);
    if (this.hasComponent(entity, component)) {
      throw new Error(`Entity ${entity} already had this component.`);
    }
    this.archetypes[this.entityMasks[entity]].delete(entity);
    // if (this.archetypes[this.entityMasks[entity]].size == 0) {
    //   delete this.archetypes[this.entityMasks[entity]];
    // }
    this.entityMasks[entity] |= 1 << component.id;
    this.archetypes[this.entityMasks[entity]] ??= new Set();
    this.archetypes[this.entityMasks[entity]].add(entity);
    this.indices[entity][component.id] = this.components.len(component);
    const comp = this.components.add(component);
    comp.owner = entity;
    return comp;
  }

  removeComponent<T extends typeof Component>(
    entity: entityT,
    component: T,
  ): InstanceType<T> {
    this.entityExists(entity);
    this.componentExists(component);
    if (!this.hasComponent(entity, component)) {
      throw new Error(
        `Entity ${entity} does not have component ${component.name}.`,
      );
    }
    this.archetypes[this.entityMasks[entity]].delete(entity);
    // if (this.archetypes[this.entityMasks[entity]].size == 0) {
    //   delete this.archetypes[this.entityMasks[entity]];
    // }
    this.entityMasks[entity] &= ~(1 << component.id);
    this.archetypes[this.entityMasks[entity]] ??= new Set();
    this.archetypes[this.entityMasks[entity]].add(entity);
    const removed = this.components.delete(
      component,
      this.indices[entity][component.id],
    );
    const backEntity = this.components.pools[component.id].active[entity].owner;
    this.indices[backEntity][component.id] = this.indices[entity][component.id];
    return removed;
  }

  getComponent<T extends typeof Component>(
    entity: entityT,
    component: T,
  ): InstanceType<T> {
    this.entityExists(entity);
    this.componentExists(component);
    if (!this.hasComponent(entity, component)) {
      throw new Error(
        `Entity ${entity} does not have component ${component.name}.`,
      );
    }
    return this.components.get(component, this.indices[entity][component.id]);
  }
}
