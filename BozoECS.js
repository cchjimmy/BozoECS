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
      archetypeMap: {} // entity to archetype mapping
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

    // if there are overlapping components, return
    if (bit & world.archetypeMap[entity]) return;

    bit = bit + (world.archetypeMap[entity] || 0);

    let oldComponents = BozoECS.removeEntity(world, entity);

    for (let i = 0; i < components.length; i++) {
      oldComponents[world.compEnums[components[i].id]] = components[i].factory();
    }

    BozoECS.insertEntity(world, entity, bit, oldComponents);
  }

  BozoECS.removeComponents = (world, entity, components) => {
    let bit = BozoECS.getComponentBit(world, components);

    // if some input components do not exist in entity, return
    if (bit & world.archetypeMap[entity] !== bit) return;

    bit = Math.abs(bit - (world.archetypeMap[entity] || 0));

    let oldComponents = BozoECS.removeEntity(world, entity);

    for (let i = 0; i < components.length; i++) {
      delete oldComponents[world.compEnums[components[i].id]];
    }

    BozoECS.insertEntity(world, entity, bit, oldComponents);
  }

  BozoECS.insertEntity = (world, entity, archetypeBit, componentObject) => {
    if (!world.archetypes[archetypeBit]) {
      world.archetypes[archetypeBit] = {
        ids: []
      }
      for (let comp in componentObject) {
        world.archetypes[archetypeBit][comp] = [];
      }
    }

    world.archetypes[archetypeBit].ids.push(entity);
    for (let comp in componentObject) {
      world.archetypes[archetypeBit][comp].push(componentObject[comp]);
    }

    world.archetypeMap[entity] = archetypeBit;
  }

  BozoECS.getComponents = (world, entity, components) => {
    let result = new Array(components.length);
    let archetype = world.archetypes[world.archetypeMap[entity]] || 0;
    let index = BozoECS.findIndex(archetype, entity);
    for (let i = 0; i < components.length; i++) {
      result[i] = archetype[world.compEnums[components[i].id]][index];
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

  BozoECS.getComponentLists = (world, components) => {
    let bit = BozoECS.getComponentBit(world, components);

    let comps = new Array(components.length);
    for (let i = 0; i < comps.length; i++) {
      comps[i] = [];
    }

    // search for archetypes with those components
    for (let a in world.archetypes) {
      // if archetype does not have all required components then skip
      if ((bit & a) !== bit) continue;
      // otherwise append components to "comps"
      for (let i = 0; i < components.length; i++) {
        comps[i].push(...world.archetypes[a][world.compEnums[components[i].id]]);
      }
    }

    return comps;
  }

  BozoECS.forEach = (world, components, callback) => {
    let comps = BozoECS.getComponentLists(world, components);

    // call the callback function
    for (let i = 0; i < comps[0].length; i++) {
      let args = new Array(components.length);
      for (let j = 0; j < comps.length; j++) {
        args[j] = comps[j][i];
      }
      callback(...args);
    }
  }

  BozoECS.instantiate = (world, entity) => {
    let e = BozoECS.createEntity();
    let archetype = world.archetypes[world.archetypeMap[entity]];
    let index = BozoECS.findIndex(archetype, entity);
    archetype.ids.push(e);
    for (let prop in archetype) {
      if (prop === "ids") continue;
      archetype[prop].push(structuredClone(archetype[prop][index]));
    }
    world.archetypeMap[e] = world.archetypeMap[entity];
    return e;
  }

  BozoECS.removeEntity = (world, entity) => {
    let archetype = world.archetypes[world.archetypeMap[entity]];
    let index = BozoECS.findIndex(archetype, entity);
    let oldComponents = {};
    for (let prop in archetype) {
      oldComponents[prop] = archetype[prop].splice(index, 1)[0];
    }
    delete oldComponents.ids;
    return oldComponents;
  }

  BozoECS.findIndex = (archetype, entity) => {
    let index = -1;
    if (!archetype) return index;
    for (let i = 0; i < archetype.ids.length; i++) {
      if (archetype.ids[i] !== entity) continue;
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