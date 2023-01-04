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
    registerComponents(components = []) {
      this.ComponentManager.registerComponents(components);
      return this;
    }
    registerSystems(systems = []) {
      for (let i = 0; i < systems.length; i++) {
        this.SystemManager.registerSystem(systems[i]);
      }
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
    }
    createEntity() {
      let id = this.nextId;
      this.addComponents(id);
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
      let types = this.world.ComponentManager.getComponentTypes(components);
      for (let i = 0; i < components.length; i++) {
        if (types[i] < 0) continue;
        archetype[types[i]] = [];
      }
      return archetype;
    }
    insertArchetype(archetype) {
      let a = this.findArchetype(archetype);
      return a ? a : this.archetypes[this.archetypes.push(archetype) - 1];
    }
    addComponents(id, components = []) {
      let oldComponents = this.removeEntity(id);
      oldComponents.push(...components);
      let a = this.createArchetype(oldComponents);
      a = this.insertArchetype(a);
      let index = a.ids.push(id) - 1;
      let types = this.world.ComponentManager.getComponentTypes(oldComponents);
      for (let i = 0; i < types.length; i++) {
        let type = types[i];
        if (type < 0) continue;
        a[type][index] = oldComponents[i].constructor.name == 'Function' ? new oldComponents[i] : oldComponents[i];
      }
    }
    removeComponents(id, components = []) {
      let oldComponents = this.removeEntity(id);
      let oldTypes = this.world.ComponentManager.getComponentTypes(oldComponents);
      let removeTypes = this.world.ComponentManager.getComponentTypes(components);
      for (let j = 0; j < oldTypes.length; j++) {
        for (let i = 0; i < removeTypes.length; i++) {
          if (oldTypes[j] != removeTypes[i]) continue;
          oldComponents.splice(j, 1);
          break;
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
        removedComponents.push(...removed);
      }
      // removes archetype with no entity
      if (!a.ids.length) this.archetypes.splice(indices[0], 1);
      return removedComponents;
    }
    /**
     * copy an entity and its components
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
        comps.push(a[type][indices[1]].copy());
      }
      let index = a.ids.push(newId) - 1;
      for (let i = 0; i < comps.length; i++) {
        let type = this.world.ComponentManager.getComponentType(comps[i].constructor);
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
      let types = this.world.ComponentManager.getComponentTypes(components);
      for (let i = 0; i < types.length; i++) {
        if (types[i] < 0) continue;
        result.push(a[types[i]][indices[1]]);
      }
      return result;
    }
    archetypesWith(componentTypes = []) {
      let result = [];
      let a = this.archetypes;
      for (let i = 0; i < a.length; i++) {
        let hasAllComponents = true;
        for (let j = 0; j < componentTypes.length; j++) {
          if (a[i][componentTypes[j]]) continue;
          hasAllComponents = false;
          break;
        }
        if (!hasAllComponents) continue;
        result.push(a[i]);
      }
      return result;
    }
    archetypesWithAny(componentTypes = []) {
      let result = [];
      let a = this.archetypes;
      for (let i = 0; i < a.length; i++) {
        let hasAnyComponent = false;
        for (let j = 0; j < componentTypes.length; j++) {
          if (!a[i][componentTypes[j]]) continue;
          hasAnyComponent = true;
          break;
        }
        if (!hasAnyComponent) continue;
        result.push(a[i]);
      }
      return result;
    }
    archetypesWithout(componentTypes = []) {
      let result = [];
      let a = this.archetypes;
      for (let i = 0; i < a.length; i++) {
        let hasAnyComponent = false;
        for (let j = 0; j < componentTypes.length; j++) {
          if (!a[i][componentTypes[j]]) continue;
          hasAnyComponent = true;
          break;
        }
        if (hasAnyComponent) continue;
        result.push(a[i]);
      }
      return result
    }
    getArchetypeTypes(archetype) {
      let types = Object.keys(archetype).sort();
      types.splice('ids', 1);
      return types;
    }
  },
  ComponentManager: class ComponentManager {
    constructor() {
      this.componentTypes = [];
    }
    registerComponents(components) {
      let types = this.getComponentTypes(components);
      for (let i = 0; i < components.length; i++) {
        if (types[i] >= 0) continue;
        this.componentTypes.push(components[i]);
      }
    }
    getComponentTypes(components = []) {
      // index = type of component in this particular world
      let types = [];
      for (let i = 0; i < this.componentTypes.length; i++) {
        for (let j = 0; j < components.length; j++) {
          if (components[j].constructor.name == 'Function' && this.componentTypes[i] == components[j]) {
            types.push(i);
            break;
          }
          if (this.componentTypes[i] != components[j].constructor) continue;
          types.push(i);
          break;
        }
      }
      return types
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
    copy() {
      let copy = new this.constructor();
      for (let type in this) {
        if (typeof this[type] == 'object') {
          Object.assign(copy[type], this[type]);
          continue;
        }
        copy[type] = this[type];
      }
      return copy;
    }
    clone() {
      return this;
    }
  },
  System: class System {
    constructor(world) {
      this.world = world;
    }
    init(args) {

    }
    run(args) {

    }
    /**
     * get entities ids with all the components listed attached, and moves results to this.queries
     * @param {*} components 
     */
    queryAll(components = []) {
      this.queries = [];
      let a = this.world.EntityManager.archetypesWith(components);
      for (let i = 0; i < a.length; i++) {
        this.queries.push(...a[i].ids);
      }
    }
    /**
     * get entities ids with any of the components listed attached, and moves results to this.queries
     * @param {*} components 
     */
    queryAny(components = []) {
      this.queries = [];
      let types = this.world.ComponentManager.getComponentTypes(components);
      let a = this.world.EntityManager.archetypesWithAny(types);
      for (let i = 0; i < a.length; i++) {
        this.queries.push(...a[i].ids);
      }
    }
    /**
     * get entities ids with the exact list of components attached, and moves results to this.queries
     * @param {*} components 
     */
    queryOnly(components = []) {
      this.queries = [];
      let a = this.world.EntityManager.createArchetype(components);
      a = this.world.EntityManager.findArchetype(a);
      if (!a) return;
      this.queries.push(...a.ids);
    }
    /**
     * get entities ids without all the component listed attached, and moves results to this.queries
     * @param {*} components 
     */
    queryNot(components = []) {
      this.queries = [];
      let types = this.world.ComponentManager.getComponentTypes(components);
      let a = this.world.EntityManager.archetypesWithout(types);
      for (let i = 0; i < a.length; i++) {
        this.queries.push(...a[i].ids);
      }
    }
    forEach(components = [], func = () => { }) {
      let table = { ids: [] };
      let types = this.world.ComponentManager.getComponentTypes(components);
      let a = this.world.EntityManager.archetypesWith(types);
      for (let i = 0; i < a.length; i++) {
        table.ids.push(...a[i].ids);
        for (let k = 0; k < types.length; k++) {
          if (!table[types[k]]) table[types[k]] = [];
          table[types[k]].push(...a[i][types[k]]);
        }
      }
      for (let i = 0; i < table.ids.length; i++) {
        let comps = [];
        for (let j = 0; j < types.length; j++) {
          comps.push(table[types[j]][i]);
        }
        func(...comps);
      }
    }
  }
}

export default BozoECS;