function createWorld() {
  return {
    archetypes: [],
    archetypeMap: [], // entity to archetype mapping
    componentMap: []
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
    properties
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
  })
}

function addComponents(world, entity, components) {
  removeEntity(world, entity);
  let type = world.archetypeMap[entity] |= getCombinedBit(components);
  (world.archetypes[type] ??= []).push(entity);
  let added = new Array(components.length);
  for (let i = 0; i < components.length; i++) {
    // reset existing component || add a new record
    let comp = (world.componentMap[components[i].id] ??= [])[entity] ??= {};
    let props = components[i].properties;
    for (let prop in props) {
      comp[prop] = props[prop];
    }
    added[i] = comp;
  }
  return added;
}

function removeComponents(world, entity, components) {
  removeEntity(world, entity);
  let type = world.archetypeMap[entity] &= ~getCombinedBit(components);
  (world.archetypes[type] ??= []).push(entity);
  let removed = new Array(components.length);
  for (let i = 0; i < components.length; i++) {
    removed[i] = world.componentMap[components[i].id][entity];
  }
  return removed;
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
    let type = Number.parseInt(a);
    if ((bit & type) !== bit) continue;
    result.push(archetypes[type]);
  }
  return [].concat(...result);
}

function removeEntity(world, entity) {
  let archetype = world.archetypes[world.archetypeMap[entity]];
  let index = archetype?.indexOf(entity) ?? -1;
  if (index > 0) archetype.splice(index, 1);
}

function getCombinedBit(components) {
  let bit = 0;
  for (let i = 0; i < components.length; i++) {
    bit += components[i].id;
  }
  return bit;
}

export default {
  createWorld,
  createSystem,
  createComponent,
  createEntity,
  update,
  addComponents,
  removeComponents,
  getComponents,
  hasComponents,
  filter,
  removeEntity,
  getCombinedBit
}