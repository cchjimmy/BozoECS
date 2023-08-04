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

  BozoECS.createWorld = () => {
    return {
      compEnum: {}, // for bitmasking
      archetypes: {},
      archetypeMap: {}, // entity to archetype mapping
      componentMap: {}
    }
  }

  BozoECS.createSystem = (update = () => { }) => {
    return {
      update
    }
  }

  BozoECS.createComponent = (properties = {}, reference = false) => {
    return {
      id: crypto.randomUUID(),
      factory: reference ? () => properties : () => structuredClone(properties)
    }
  }

  BozoECS.createEntity = () => {
    return crypto.randomUUID();
  }

  BozoECS.update = (world, systems, ...args) => {
    for (let i = 0; i < systems.length; i++) {
      systems[i].update(world, ...args);
    }
  }

  BozoECS.addComponents = (world, entity, components) => {
    let bit = BozoECS.getCombinedBit(world.compEnum, components);
    let entityType = world.archetypeMap[entity] || 0;

    bit |= entityType;

    let oldComponents = BozoECS.removeEntity(world, entity);

    for (let i = 0; i < components.length; i++) {
      oldComponents[world.compEnum[components[i].id]] = components[i].factory();
    }

    BozoECS.insertEntity(world, entity, bit, oldComponents);
  }

  BozoECS.removeComponents = (world, entity, components) => {
    let bit = BozoECS.getCombinedBit(world.compEnum, components);
    let entityType = world.archetypeMap[entity] || 0;

    bit = entityType & ~bit;

    let oldComponents = BozoECS.removeEntity(world, entity);

    for (let i = 0; i < components.length; i++) {
      delete oldComponents[world.compEnum[components[i].id]];
    }

    BozoECS.insertEntity(world, entity, bit, oldComponents);
  }

  BozoECS.insertEntity = (world, entity, archetypeBit, componentObject) => {
    world.archetypes[archetypeBit] ??= [];
    world.archetypes[archetypeBit].push(entity);
    world.archetypeMap[entity] = archetypeBit;
    for (let bit in componentObject) {
      world.componentMap[bit] ??= {};
      world.componentMap[bit][entity] = componentObject[bit];
    }
  }

  BozoECS.getComponents = (world, entity, components) => {
    let result = new Array(components.length);
    let comps = world.componentMap;
    let e = world.compEnum;
    for (let i = 0; i < components.length; i++) {
      result[i] = comps[e[components[i].id]][entity];
    }
    return result;
  }

  BozoECS.hasComponents = (world, entity, components) => {
    let bit = BozoECS.getCombinedBit(world.compEnum, components);
    return world.archetypeMap[entity] & bit === bit;
  }

  BozoECS.forEach = (world, components, callback) => {
    let entities = BozoECS.filter(world, components);
    for (let i = 0; i < entities.length; i++) {
      callback(entities[i]);
    }
  }

  BozoECS.filter = (world, components) => {
    let entities = [];
    let archetypes = world.archetypes;
    let bit = BozoECS.getCombinedBit(world.compEnum, components);
    for (let a in archetypes) {
      if ((bit & a) !== bit) continue;
      entities.push(...archetypes[a]);
    }
    return entities;
  }

  BozoECS.instantiate = (world, entity) => {
    let e = BozoECS.createEntity();
    let type = world.archetypeMap[entity];
    world.archetypes[type].push(e);
    world.archetypeMap[e] = type;
    let cMap = world.componentMap;
    for (let comp in cMap) {
      if (!(comp & type)) continue;
      let comps = cMap[comp];
      comps[e] = structuredClone(comps[entity]);
    }
    return e;
  }

  BozoECS.removeEntity = (world, entity) => {
    let type = world.archetypeMap[entity]
    let archetype = world.archetypes[type];
    let index = BozoECS.findIndex(archetype, entity);
    if (index !== -1) archetype.splice(index, 1);
    let cMap = world.componentMap;
    let oldComponents = {};
    for (let comp in cMap) {
      if (!(comp & type)) continue;
      oldComponents[comp] = cMap[comp][entity];
      delete cMap[comp][entity];
    }
    return oldComponents;
  }

  BozoECS.findIndex = (archetype, entity) => {
    let index = -1;
    for (let i = 0; i < archetype?.length; i++) {
      if (archetype[i] !== entity) continue;
      index = i;
      break;
    }
    return index;
  }

  BozoECS.getCombinedBit = (compEnum, components) => {
    let bit = 0;
    for (let i = 0; i < components.length; i++) {
      bit += (compEnum[components[i].id] ??= 1 << Object.keys(compEnum).length);
    }
    return bit;
  }

  // Just return a value to define the module export.
  // This example returns an object, but the module
  // can return a function as the exported value.
  return BozoECS;
}));