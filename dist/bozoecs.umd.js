(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.bozoecs = factory());
})(this, (function () { 'use strict';

  function createWorld() {
    return {
      archetypes: {},
      archetypeMap: {}, // entity to archetype mapping
      componentMap: {}
    }
  }

  function createSystem(update = () => { }) {
    return {
      update
    }
  }

  var nextCompId = 1;
  function createComponent(properties) {
    let comp = {
      id: nextCompId,
      properties,
      factory() {
        let instance = {};
        for (let prop in this.properties) {
          instance[prop] = this.properties[prop];
        }
        return instance;
      }
    };
    nextCompId <<= 1;
    return comp;
  }

  var nextEntityId = 0;
  function createEntity() {
    let e = nextEntityId;
    nextEntityId++;
    return e;
  }

  function update(systems, ...args) {
    systems.forEach(system => {
      system.update(...args);
    });
  }

  function addComponents(world, entity, components) {
    let bit = getCombinedBit(components);

    bit |= world.archetypeMap[entity];

    let oldComponents = removeEntity(world, entity);

    let added = new Array(components.length);

    for (let i = 0; i < components.length; i++) {
      oldComponents[components[i].id] = added[i] = components[i].factory();
    }

    insertEntity(world, entity, bit, oldComponents);

    return added;
  }

  function removeComponents(world, entity, components) {
    let bit = getCombinedBit(components);

    bit = world.archetypeMap[entity] & ~bit;

    let oldComponents = removeEntity(world, entity);

    let removed = new Array(components.length);

    for (let i = 0; i < components.length; i++) {
      removed[i] = oldComponents[components[i].id];
      delete oldComponents[components[i].id];
    }

    insertEntity(world, entity, bit, oldComponents);

    return removed;
  }

  function insertEntity(world, entity, archetypeBit, componentObject) {
    world.archetypes[archetypeBit] ??= [];
    world.archetypes[archetypeBit].push(entity);
    world.archetypeMap[entity] = archetypeBit;
    for (let comp in componentObject) {
      world.componentMap[comp] ??= {};
      world.componentMap[comp][entity] = componentObject[comp];
    }
  }

  function getComponents(world, entity, components) {
    let result = new Array(components.length);
    for (let i = 0; i < components.length; i++) {
      result[i] = world.componentMap[components[i].id][entity];
    }
    return result;
  }

  function hasComponents(world, entity, components) {
    let bit = getCombinedBit(components);
    return (world.archetypeMap[entity] & bit) === bit;
  }

  function filter(world, components) {
    let result = [];
    let archetypes = world.archetypes;
    let bit = getCombinedBit(components);
    for (let a in archetypes) {
      if ((bit & a) !== bit) continue;
      result.push(archetypes[a]);
    }
    return [].concat(...result);
  }

  function removeEntity(world, entity) {
    let type = world.archetypeMap[entity];
    let archetype = world.archetypes[type] || [];
    let oldComponents = {};
    let index = archetype.indexOf(entity);
    if (index === -1) return oldComponents;
    archetype.splice(index, 1);
    let cMap = world.componentMap;
    for (let comp in cMap) {
      if (!(comp & type)) continue;
      oldComponents[comp] = cMap[comp][entity];
      delete cMap[comp][entity];
    }
    return oldComponents;
  }

  function getCombinedBit(components) {
    let bit = 0;
    for (let i = 0; i < components.length; i++) {
      bit += components[i].id;
    }
    return bit;
  }

  var main = {
    createWorld,
    createSystem,
    createComponent,
    createEntity,
    update,
    addComponents,
    removeComponents,
    insertEntity,
    getComponents,
    hasComponents,
    filter,
    removeEntity,
    getCombinedBit
  };

  return main;

}));
