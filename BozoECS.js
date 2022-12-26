const BozoECS = {
  World: class World {
    constructor() {
      this.EntityManager = new BozoECS.EntityManager(this);
      this.ComponentManager = new BozoECS.ComponentManager;
      this.SystemManager = new BozoECS.SystemManager(this);
    }
    createEntity() {
      return this.EntityManager.createEntity();
    }
    registerComponent(component) {
      this.ComponentManager.registerComponent(component);
      return this;
    }
    registerSystem(system) {
      this.SystemManager.registerSystem(system);
      return this;
    }
    init(...args) {
      for (let i = 0; i < this.SystemManager.enabledSystems.length; i++) {
        this.SystemManager.enabledSystems[i].init(args);
      }
    }
    run(...args) {
      for (let i = 0; i < this.SystemManager.enabledSystems.length; i++) {
        this.SystemManager.enabledSystems[i].run(args);
      }
    }
  },
  EntityManager: class EntityManager {
    constructor(world) {
      this.world = world;
      this.archetypes = [];
      this.nextId = 0;
      this.createArchetype();
    }
    createEntity() {
      let id = this.nextId;
      this.insertEntity(id);
      this.nextId++;
      return id;
    }
    /**
     * creates a new archetype if not already exists and insert it into archetypes table and returns a reference of it. Returns a reference archetype object if already exists
     * @param {*} components 
     * @returns reference of archetype object
     */
    createArchetype(components = []) {
      let archetype = { ids: [] };
      for (let i = 0; i < components.length; i++) {
        let type = this.world.ComponentManager.findComponentType(components[i]);
        if (type < 0) continue;
        archetype[type] = [];
      }
      return this.insertArchetype(archetype);
    }
    insertArchetype(archetype) {
      let a = this.findArchetype(archetype);
      return a ? a : this.archetypes[this.archetypes.push(archetype) - 1];
    }
    insertEntity(id, components = []) {
      this.addComponents(id, components);
    }
    addComponents(id, components = []) {
      let oldComponents = this.removeEntity(id);
      oldComponents.push(...components);
      let a = this.createArchetype(oldComponents);
      let index = a.ids.push(id) - 1;
      for (let i = 0; i < oldComponents.length; i++) {
        let type = this.world.ComponentManager.findComponentType(oldComponents[i]);
        if (type < 0) continue;
        a[type][index] = new oldComponents[i];
      }
    }
    removeComponents(id, components = []) {
      let oldComponents = this.removeEntity(id);
      for (let i = 0; i < components.length; i++) {
        for (let j = 0; j < oldComponents.length; j++) {
          if (this.world.ComponentManager.findComponentType(oldComponents[j]) !== this.world.ComponentManager.findComponentType(components[i])) continue;
          oldComponents.splice(j, 1);
        }
      }
      this.addComponents(id, oldComponents);
    }
    /**
     * removes entity from archetype table
     * @param {*} id 
     * @returns components of the removed entity
     */
    removeEntity(id) {
      let indices = this.findEntity(id);
      let removedComponents = [];
      if (!indices) return removedComponents;
      let a = this.archetypes[indices[0]];
      for (let type in a) {
        let removed = a[type].splice(indices[1], 1);
        if (type == 'ids') continue;
        removedComponents.push(removed);
      }
      // removes archetype with no entity
      if (!a.ids.length) this.archetypes.splice(indices[0], 1);
      return removedComponents;
    }
    /**
     * clone an entity with id
     * @param {*} id 
     * @returns id of newly instantiated entity
     */
    instantiate(id) {
      let indices = this.findEntity(id);
      if (!indices) return;
      let a = this.archetypes[indices[0]];
      let newId = this.createEntity();
      this.removeEntity(newId);
      let comps = [];
      for (let type in a) {
        if (type == 'ids') continue;
        comps.push(a[type][indices[1]].clone());
      }
      let index = a.ids.push(newId) - 1;
      for (let i = 0; i < comps.length; i++) {
        let type = this.world.ComponentManager.findComponentType(comps[i].constructor);
        a[type][index] = comps[i];
      }
      return newId;
    }
    /**
     * returns the index of the archetype housing the entity the index of entity in the archetype if entity exists
     * @param {*} id 
     * @returns [index of archetype, index of entity]
     */
    findEntity(id) {
      for (let i = 0; i < this.archetypes.length; i++) {
        for (let j = 0; j < this.archetypes[i].ids.length; j++) {
          if (this.archetypes[i].ids[j] == id) return [i, j];
        }
      }
    }
    /**
     * finds archetype in archetypes table
     * @param {*} archetype 
     * @returns reference of archetype
     */
    findArchetype(archetype) {
      // credit: https://stackoverflow.com/questions/14368596/how-can-i-check-that-two-objects-have-the-same-set-of-property-names
      let keys1 = Object.keys(archetype).sort();
      for (let i = 0; i < this.archetypes.length; i++) {
        let keys2 = Object.keys(this.archetypes[i]).sort();
        if (JSON.stringify(keys1) !== JSON.stringify(keys2)) continue;
        return this.archetypes[i];
      }
    }
    getComponents(id, components = []) {
      let indices = this.findEntity(id);
      if (!indices) return;
      let result = [];
      let a = this.archetypes[indices[0]];
      if (!components.length) {
        for (let type in a) {
          if (type == 'ids') continue;
          result.push(a[type][indices[1]]);
        }
        return result;
      }
      for (let i = 0; i < components.length; i++) {
        let type = this.world.ComponentManager.findComponentType(components[i]);
        let component = a[type][indices[1]];
        if (!component) continue;
        result.push(component);
      }
      return result;
    }
  },
  ComponentManager: class ComponentManager {
    constructor() {
      this.componentTypes = [];
    }
    registerComponent(component) {
      if (this.findComponentType(component) >= 0) return;
      this.componentTypes.push(component);
    }
    findComponentType(component) {
      // index = type of component in this particular world
      return this.componentTypes.indexOf(component);
    }
  },
  SystemManager: class SystemManager {
    constructor(world) {
      this.world = world;
      this.systems = [];
      this.enabledSystems = [];
    }
    registerSystem(system) {
      if (this.findSystemType(system) >= 0) return;
      this.enableSystem(this.systems[this.systems.push(system) - 1]);
    }
    findSystemType(system) {
      return this.systems.indexOf(system);
    }
    enableSystem(system) {
      let index = this.findSystemType(system);
      if (index < 0) return;
      this.enabledSystems.push(new this.systems[index](this.world));
    }
    disableSystem(system) {
      let index = this.findSystemType(system);
      if (index < 0) return;
      this.enabledSystems.splice(index, 1);
    }
  },
  Component: class Component {
    // needs to register this component to have a defined type, i.e. 0, 1, 2, 3...
    clone() {
      let clone = new this.constructor();
      for (let type in this) {
        if (typeof this[type] == 'object') {
          Object.assign(clone[type], this[type])
          continue;
        }
        clone[type] = this[type];
      }
      return clone;
    }
  },
  System: class System {
    constructor(world) {
      this.world = world;
      this.queries = {};
    }
    init(args) {

    }
    run(args) {

    }
    /**
     * find archetypes with all the components listed, and move results to this.queries
     * @param {*} components 
     */
    queryAll(components = []) {
      this.queries = {};
      let a = this.world.EntityManager.createArchetype(components);
      for (let type in a) {
        if (type == 'ids') continue;
        this.queries[this.world.ComponentManager.componentTypes[type].name] = a[type];
      }
    }
    /**
     * find archetypes with any of the component listed, and move results to this.queries
     * @param {*} components 
     */
    queryAny(components = []) {
      this.queries = {};
      for (let i = 0; i < this.world.EntityManager.archetypes.length; i++) {
        let a = this.world.EntityManager.archetypes[i];
        for (let j = 0; j < components.length; j++) {
          let type = this.world.ComponentManager.findComponentType(components[j]);
          if (!a[type]) continue;
          let name = components[j].name;
          if (!this.queries[name]) this.queries[name] = [];
          this.queries[name].push(...a[type]);
        }
      }
    }
  }
}

export default BozoECS;