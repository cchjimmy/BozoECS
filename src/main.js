var store = {
  entities: [],
  components: [],
};

export function createWorld() {
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

export function createComponent(properties) {
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

export function createEntity() {
  return store.entities.pop() ?? entityIdGenerator.next().value;
}

export function registerComponents(world, components) {
  for (let i = 0; i < components.length; i++) {
    world.components[components[i].id] ??= [];
    store.components[components[i].id] ??= [];
  }
}

export function getComponents(world, entity, components) {
  for (let i = 0; i < components.length; i++) {
    components[i] = world.components[components[i].id][entity];
  }
  return components;
}

export function addComponents(world, entity, components) {
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

export function removeComponents(world, entity, components) {
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

export function hasComponent(world, entity, component) {
  return !!(world.archetypeMap[entity] & component.id);
}

export function createFilter(...components) {
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

export function createSystem(filter) {
  return (...subsystems) => {
    return (world) => {
      let entities = filter(world);
      for (let i = 0; i < entities.length; i++) {
        subsystems.reduce((out, sys) => sys(out), [world, entities[i]]);
      }
    };
  };
}

export function removeEntity(world, entity) {
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
