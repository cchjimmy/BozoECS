// credit: https://github.com/umdjs/umd/blob/master/templates/returnExports.js

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root["BozoECS"] = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  const BozoECS = {};

  BozoECS.createWorld = (systems) => {
    let world = {
      compEnums: {}, // for bitmasking
      archetypes: {}, // entity components storage
      archetypeMap: {}, // entity to archetype mapping
      componentMap: {}
    };
    BozoECS.defineSystems(world, systems);
    return world;
  }

  BozoECS.createSystem = (update = () => { }) => {
    return {
      update
    }
  }

  BozoECS.createComponent = (properties) => {
    return {
      id: crypto.randomUUID(),
      factory: () => structuredClone(properties)
    }
  }

  BozoECS.createEntity = () => {
    return crypto.randomUUID();
  }

  BozoECS.update = (world, ...args) => {
    for (let i = 0; i < world.systems.length; i++) {
      world.systems[i].update(world, ...args);
    }
  }

  BozoECS.addComponents = (world, entity, components) => {
    let bit = BozoECS.getComponentBit(world, components);
    let entityType = world.archetypeMap[entity];

    // if there are overlapping components, return
    if (bit & entityType) return;

    bit = bit + (entityType || 0);

    let oldComponents = BozoECS.removeEntity(world, entity);

    for (let i = 0; i < components.length; i++) {
      oldComponents[world.compEnums[components[i].id]] = components[i].factory();
    }

    BozoECS.insertEntity(world, entity, bit, oldComponents);
  }

  BozoECS.removeComponents = (world, entity, components) => {
    let bit = BozoECS.getComponentBit(world, components);
    let entityType = world.archetypeMap[entity]

    // if some input components do not exist in entity, return
    if (bit & entityType !== bit) return;

    bit = Math.abs(bit - (entityType || 0));

    let oldComponents = BozoECS.removeEntity(world, entity);

    for (let i = 0; i < components.length; i++) {
      delete oldComponents[world.compEnums[components[i].id]];
    }

    BozoECS.insertEntity(world, entity, bit, oldComponents);
  }

  BozoECS.insertEntity = (world, entity, archetypeBit, componentObject) => {
    if (!world.archetypes[archetypeBit]) {
      world.archetypes[archetypeBit] = [];
    }

    world.archetypes[archetypeBit].push(entity);
    
    world.componentMap[entity] = componentObject;

    world.archetypeMap[entity] = archetypeBit;
  }

  BozoECS.getComponents = (world, entity, components) => {
    let result = new Array(components.length);
    for (let i = 0; i < components.length; i++) {
      result[i] = world.componentMap[entity][world.compEnums[components[i].id]];
    }
    return result;
  }

  BozoECS.hasComponents = (world, entity, components) => {
    let bit = BozoECS.getComponentBit(world, components);
    let archetype = world.archetypeMap[entity];
    return archetype & bit === bit;
  }

  BozoECS.defineSystems = (world, systems) => {
    world.systems = systems;
  }

  BozoECS.forEach = (world, components, callback) => {
    let entities = [];
    let bit = BozoECS.getComponentBit(world, components);
    for (let a in world.archetypes) {
      if ((bit & a) !== bit) continue; // 
      entities.push(...world.archetypes[a]);
    }
    for (let i = 0; i < entities.length; i++) {
      let comps = world.componentMap[entities[i]];
      let args = new Array(components.length);
      for (let j = 0; j < components.length; j++) {
        args[j] = comps[world.compEnums[components[j].id]];
      }
      callback(...args);
    }
  }

  BozoECS.instantiate = (world, entity) => {
    let e = BozoECS.createEntity();
    let archetype = world.archetypes[world.archetypeMap[entity]];
    archetype.push(e);
    let comps = world.componentMap[entity];
    world.componentMap[e] = {};
    for (let prop in comps) {
      world.componentMap[e][prop] = structuredClone(comps[prop]);
    }
    world.archetypeMap[e] = world.archetypeMap[entity];
    return e;
  }

  BozoECS.removeEntity = (world, entity) => {
    let archetype = world.archetypes[world.archetypeMap[entity]];
    let index = BozoECS.findIndex(archetype, entity);
    if (index !== -1) archetype.splice(index, 1);
    let oldComponents = world.componentMap[entity] || {};
    delete world.componentMap[entity];
    return oldComponents;
  }

  BozoECS.findIndex = (archetype, entity) => {
    let index = -1;
    if (!archetype) return index;
    for (let i = 0; i < archetype.length; i++) {
      if (archetype[i] !== entity) continue;
      index = i;
      break;
    }
    return index;
  }

  BozoECS.getComponentBit = (world, components) => {
    let unique = Object.keys(world.compEnums).length;
    let bit = 0;
    for (let i = 0; i < components.length; i++) {
      if (!world.compEnums[components[i].id]) {
        world.compEnums[components[i].id] = 2 ** unique;
        unique++;
      }
      bit += world.compEnums[components[i].id];
    }
    return bit;
  }

  // Just return a value to define the module export.
  // This example returns an object, but the module
  // can return a function as the exported value.
  return BozoECS;
}));