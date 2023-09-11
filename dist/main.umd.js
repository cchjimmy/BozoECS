(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports)
    : typeof define === "function" && define.amd
    ? define(["exports"], factory)
    : ((global =
        typeof globalThis !== "undefined" ? globalThis : global || self),
      factory((global.bozoecs = {})));
})(this, function (exports) {
  "use strict";

  var store = {
    entities: [],
    components: [],
  };

  function createWorld() {
    return {
      archetypeMap: [], // entity to archetype mapping
      componentMap: [],
      archetypes: [],
    };
  }

  function createSystem(update = () => {}) {
    return { update };
  }

  const compIdGenerator = (function* () {
    var id = 1;
    while (true) {
      yield id;
      id <<= 1;
    }
  })();

  function createComponent(properties) {
    return {
      id: compIdGenerator.next().value,
      properties,
    };
  }

  const entityIdGenerator = (function* () {
    var nextId = 0;
    while (true) {
      yield nextId;
      nextId++;
    }
  })();

  function createEntity() {
    return store.entities.length
      ? store.entities.pop()
      : entityIdGenerator.next().value;
  }

  function update(systems, ...args) {
    systems.forEach((system) => {
      system.update(...args);
    });
  }

  function getComponents(world, entity, components) {
    for (let i = 0; i < components.length; i++) {
      components[i] = world.componentMap[components[i].id][entity];
    }
    return components;
  }

  function addComponents(world, entity, components) {
    let oldType = (world.archetypeMap[entity] ??= 0);
    let newType = oldType | getCombinedBit(components);
    if (oldType != newType) moveEntity(world, entity, oldType, newType);
    for (let i = 0; i < components.length; i++) {
      let map = (world.componentMap[components[i].id] ??= []);
      map[entity] = store.components[components[i].id]?.pop() ?? {};
      components[i] = Object.assign(map[entity], components[i].properties);
    }
    return components;
  }

  function removeComponents(world, entity, components) {
    let oldType = (world.archetypeMap[entity] ??= 0);
    let newType = oldType & ~getCombinedBit(components);
    if (oldType != newType) moveEntity(world, entity, oldType, newType);
    for (let i = 0; i < components.length; i++) {
      let map = world.componentMap[components[i].id];
      (store.components[components[i].id] ??= []).push(map[entity]);
      map[entity] = null;
    }
  }

  function moveEntity(world, entity, typeBefore, typeAfter) {
    let archtypes = world.archetypes;
    let old = (archtypes[typeBefore] ??= []);
    let index = old.indexOf(entity);
    (archtypes[typeAfter] ??= []).push(
      index == -1 ? entity : old.splice(index, 1)[0],
    );
    world.archetypeMap[entity] = typeAfter;
  }

  function hasComponent(world, entity, component) {
    return !!(world.archetypeMap[entity] & component.id);
  }

  function filter(world, components, callback) {
    let bit = getCombinedBit(components);
    for (let a in world.archetypes) {
      if ((a & bit) !== bit) continue;
      let archetype = world.archetypes[a];
      for (let i = 0; i < archetype.length; i++) {
        callback(archetype[i]);
      }
    }
  }

  function removeEntity(world, entity) {
    let type = world.archetypeMap[entity];
    if (!type) return;
    world.archetypes[type].splice(world.archetypes[type].indexOf(entity), 1);
    world.archetypeMap[entity] = 0;
    store.entities.push(entity);
    let cMap = world.componentMap;
    for (let comp in cMap) {
      if (!(type & comp)) continue;
      (store.components[comp] ??= []).push(cMap[comp][entity]);
      cMap[comp][entity] = null;
    }
  }

  function getCombinedBit(components) {
    let bit = 0;
    for (let i = 0; i < components.length; i++) {
      bit += components[i].id;
    }
    return bit;
  }

  exports.addComponents = addComponents;
  exports.createComponent = createComponent;
  exports.createEntity = createEntity;
  exports.createSystem = createSystem;
  exports.createWorld = createWorld;
  exports.filter = filter;
  exports.getComponents = getComponents;
  exports.hasComponent = hasComponent;
  exports.removeComponents = removeComponents;
  exports.removeEntity = removeEntity;
  exports.update = update;
});
