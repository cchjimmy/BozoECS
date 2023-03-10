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
    init() {
      for (let i = 0; i < this.SystemManager.enabledSystems.length; i++) {
        this.SystemManager.enabledSystems[i].init(...arguments);
      }
    }
    run() {
      for (let i = 0; i < this.SystemManager.enabledSystems.length; i++) {
        this.SystemManager.enabledSystems[i].run(...arguments);
      }
    }
  },
  EntityManager: class EntityManager {
    constructor(world) {
      this.world = world;
      this.archetypes = [];
      this.nextId = -1;
    }
    createEntity() {
      this.nextId++;
      return this.nextId;
    }
    /**
     * creates a new archetype if not already exists and insert it into archetypes table and returns a reference of it. Returns a reference archetype object if already exists
     * @param {*} componentTypes 
     * @returns reference of archetype object
     */
    createArchetype(componentTypes = []) {
      let archetype = { ids: [] };
      for (let i = 0; i < componentTypes.length; i++) {
        if (componentTypes[i] >= 0) archetype[componentTypes[i]] = [];
      }
      return archetype;
    }
    insertArchetype(archetype) {
      return this.findArchetype(archetype) ?? this.archetypes[this.archetypes.push(archetype) - 1];
    }
    addComponents(id, components = []) {
      let oldComponents = this.removeEntity(id);
      oldComponents.push(...components);
      let types = this.world.ComponentManager.getComponentTypes(oldComponents);
      let a = this.createArchetype(types);
      a = this.insertArchetype(a);
      a.ids.push(id);
      for (let i = 0; i < oldComponents.length; i++) {
        a[types[i]].push(oldComponents[i].constructor.name == 'Function' ? new oldComponents[i] : oldComponents[i]);
      }
      return id;
    }
    removeComponents(id, components = []) {
      let oldComponents = this.removeEntity(id);
      for (let j = 0; j < oldComponents.length; j++) {
        for (let i = 0; i < components.length; i++) {
          if (oldComponents[j].constructor.name != components[i].name) continue;
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
      let removedComponents = [];
      let indices = this.findEntity(id);
      if (!indices) return removedComponents;
      let a = this.archetypes[indices[0]];
      a.ids.splice(indices[1], 1);
      let compTypes = this.getArchetypeTypes(a);
      for (let i = 0; i < compTypes.length; i++) {
        removedComponents.push(...a[compTypes[i]].splice(indices[1], 1));
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
      let compTypes = this.getArchetypeTypes(a);
      for (let i = 0; i < comptypes.length; i++) {
        a[compTypes[i]].push(a[compTypes[i]][indices[1]].copy());
      }
      return newId;
    }
    /**
     * returns the archetype index housing the entity, and the entity index in the archetype if entity exists
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
        if (JSON.stringify(keys1) == JSON.stringify(keys2)) return this.archetypes[i];
      }
    }
    getComponents(id, components = []) {
      let result = [];
      let indices = this.findEntity(id);
      if (!indices) return result;
      let a = this.archetypes[indices[0]];
      let types = components.length ? this.world.ComponentManager.getComponentTypes(components) : this.world.EntityManager.getArchetypeTypes(a);
      for (let i = 0; i < types.length; i++) {
        if (a[types[i]]) result.push(a[types[i]][indices[1]]);
      }
      return result;
    }
    archetypesWith(componentTypes = []) {
      let result = [];
      for (let i = 0; i < this.archetypes.length; i++) {
        for (let j = 0; j < componentTypes.length; j++) {
          if (!this.archetypes[i][componentTypes[j]]) break;
          if (j == componentTypes.length - 1) result.push(this.archetypes[i]);
        }
      }
      return result;
    }
    archetypesWithAny(componentTypes = []) {
      let result = [];
      for (let i = 0; i < this.archetypes.length; i++) {
        for (let j = 0; j < componentTypes.length; j++) {
          if (!this.archetypes[i][componentTypes[j]]) continue;
          result.push(this.archetypes[i])
          break;
        }
      }
      return result;
    }
    archetypesWithout(componentTypes = []) {
      let result = [];
      for (let i = 0; i < this.archetypes.length; i++) {
        for (let j = 0; j < componentTypes.length; j++) {
          if (this.archetypes[i][componentTypes[j]]) break;
          if (j == componentTypes.length - 1) result.push(this.archetypes[i]);
        }
      }
      return result
    }
    getArchetypeTypes(archetype) {
      let types = Object.keys(archetype);
      // 'ids' in an archetype is always added last, so this should remove the 'ids' key in an archetype
      types.splice(-1, 1);
      return types;
    }
  },
  ComponentManager: class ComponentManager {
    constructor() {
      this.componentTypes = [];
    }
    registerComponents(components) {
      let types = this.getComponentTypes(components);
      for (let i = 0; i < types.length; i++) {
        if (types[i] >= 0) continue;
        this.componentTypes.push(components[i]);
      }
    }
    /**
     * find the type of a component class
     * @param {*} components component classes in an array
     * @returns component types in an array
     */
    getComponentTypes(components = []) {
      // index = type of component in this particular world
      let types = new Array(components.length);
      for (let j = 0; j < components.length; j++) {
        let comp = components[j].constructor.name == 'Function' ? components[j] : components[j].constructor;
        for (let i = 0; i < this.componentTypes.length; i++) {
          if (this.componentTypes[i] != comp) continue;
          types[j] = i;
          break;
        }
        (types[j] >= 0) || (types[j] = -1);
      }
      return types;
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
      let copy = new this.constructor;
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
     * get entities ids with all the components listed attached
     * @param {*} components 
     * @returns an array of entity ids
     */
    queryAll(components = []) {
      let ids = [];
      let types = this.world.ComponentManager.getComponentTypes(components);
      let a = this.world.EntityManager.archetypesWith(types);
      for (let i = 0; i < a.length; i++) {
        ids.push(...a[i].ids);
      }
      return ids;
    }
    /**
     * get entity ids with any of the components listed attached
     * @param {*} components 
     * @returns an array of entity ids
     */
    queryAny(components = []) {
      let ids = [];
      let types = this.world.ComponentManager.getComponentTypes(components);
      let a = this.world.EntityManager.archetypesWithAny(types);
      for (let i = 0; i < a.length; i++) {
        ids.push(...a[i].ids);
      }
      return ids;
    }
    /**
     * get entity ids with the exact list of components attached
     * @param {*} components 
     * @returns an array of entity ids
     */
    queryOnly(components = []) {
      let types = this.world.ComponentManager.getComponentTypes(components);
      let a = this.world.EntityManager.createArchetype(types);
      a = this.world.EntityManager.findArchetype(a);
      return a ? [...a.ids] : [];
    }
    /**
     * get entity ids without any of the component listed attached
     * @param {*} components 
     * @returns an array of entity ids
     */
    queryNot(components = []) {
      let ids = [];
      let types = this.world.ComponentManager.getComponentTypes(components);
      let a = this.world.EntityManager.archetypesWithout(types);
      for (let i = 0; i < a.length; i++) {
        ids.push(...a[i].ids);
      }
      return ids;
    }
    forEach(components = [], func = () => { }) {
      let types = this.world.ComponentManager.getComponentTypes(components);
      let table = { ids: [] };
      for (let i = 0; i < types.length; i++) {
        table[types[i]] = [];
      }
      let a = this.world.EntityManager.archetypesWith(types);
      for (let i = 0; i < a.length; i++) {
        table.ids.push(...a[i].ids);
        for (let j = 0; j < types.length; j++) {
          table[types[j]].push(...a[i][types[j]]);
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