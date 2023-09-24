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
      archetypeMap: [], // entity to archetype
      components: [],
      archetypes: [], // archetype to entities
    };
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
    return store.entities.pop() ?? entityIdGenerator.next().value;
  }

  function registerComponents(world, components) {
    for (let i = 0; i < components.length; i++) {
      world.components[components[i].id] ??= [];
      store.components[components[i].id] ??= [];
    }
  }

  function getComponents(world, entity, components) {
    for (let i = 0; i < components.length; i++) {
      components[i] = world.components[components[i].id][entity];
    }
    return components;
  }

  function addComponents(world, entity, components) {
    let oldType = world.archetypeMap[entity];
    let newType = oldType;
    for (let i = 0; i < components.length; i++) {
      newType |= components[i].id;
      world.components[components[i].id][entity] = Object.assign(
        store.components[components[i].id].pop() ?? {},
        components[i].properties,
      );
    }
    moveEntity(world, entity, oldType, newType);
    return getComponents(world, entity, components);
  }

  function removeComponents(world, entity, components) {
    let oldType = world.archetypeMap[entity];
    let newType = oldType;
    for (let i = 0; i < components.length; i++) {
      newType &= ~components[i].id;
      store.components[components[i].id].push(
        world.components[components[i].id][entity],
      );
      world.components[components[i].id][entity] = null;
    }
    moveEntity(world, entity, oldType, newType);
  }

  function moveEntity(world, entity, typeBefore, typeAfter) {
    if (typeBefore == typeAfter) return;
    let oldList = world.archetypes[typeBefore];
    let newList = (world.archetypes[typeAfter] ??= []);
    newList.push(oldList ? oldList.splice(entity, 1)[0] : entity);
    world.archetypeMap[entity] = typeAfter;
  }

  function hasComponent(world, entity, component) {
    return !!(world.archetypeMap[entity] & component.id);
  }

  function createFilter(...components) {
    let bit = 0;
    for (let i = 0; i < components.length; i++) {
      bit += components[i].id;
    }
    let result = [];
    return function filter(world) {
      result.length = 0;
      for (let a in world.archetypes) {
        if ((a & bit) !== bit) continue;
        let archetype = world.archetypes[a];
        result.push(...archetype);
      }
      return result;
    };
  }

  function createSystem(filter) {
    return (...subsystems) => {
      return (world) => {
        let entities = filter(world);
        for (let i = 0; i < entities.length; i++) {
          subsystems.reduce((out, sys) => sys(out), [world, entities[i]]);
        }
      };
    };
  }

  function removeEntity(world, entity) {
    let type = world.archetypeMap[entity];
    if (!type) return;
    world.archetypes[type].splice(world.archetypes[type].indexOf(entity), 1);
    world.archetypeMap[entity] = null;
    store.entities.push(entity);
    for (let comp in world.components) {
      store.components[comp].push(world.components[comp][entity]);
      world.components[comp][entity] = null;
    }
  }

  exports.addComponents = addComponents;
  exports.createComponent = createComponent;
  exports.createEntity = createEntity;
  exports.createFilter = createFilter;
  exports.createSystem = createSystem;
  exports.createWorld = createWorld;
  exports.getComponents = getComponents;
  exports.hasComponent = hasComponent;
  exports.registerComponents = registerComponents;
  exports.removeComponents = removeComponents;
  exports.removeEntity = removeEntity;
});
