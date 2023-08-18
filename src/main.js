module.exports = {
  createWorld() {
    return {
      compEnum: {}, // for bitmasking
      archetypes: {},
      archetypeMap: {}, // entity to archetype mapping
      componentMap: {}
    }
  },

  createSystem(update = () => { }) {
    return {
      update
    }
  },

  createComponent(properties, reference = false) {
    return {
      id: crypto.randomUUID(),
      factory: reference ? () => properties : () => structuredClone(properties)
    }
  },

  createEntity() {
    return crypto.randomUUID();
  },

  update(systems, ...args) {
    for (let i = 0; i < systems.length; i++) {
      systems[i].update(...args);
    }
  },

  addComponents(world, entity, components) {
    let bit = getCombinedBit(world.compEnum, components);

    bit |= world.archetypeMap[entity];

    let oldComponents = removeEntity(world, entity);

    let added = new Array(components.length);

    for (let i = 0; i < components.length; i++) {
      oldComponents[components[i].id] = components[i].factory();
      added[i] = oldComponents[components[i].id];
    }

    insertEntity(world, entity, bit, oldComponents);

    return added;
  },

  removeComponents(world, entity, components) {
    let bit = getCombinedBit(world.compEnum, components);

    bit = world.archetypeMap[entity] & ~bit;

    let oldComponents = removeEntity(world, entity);

    let removed = new Array(components.length);

    for (let i = 0; i < components.length; i++) {
      removed[i] = oldComponents[components[i].id];
      delete oldComponents[components[i].id];
    }

    insertEntity(world, entity, bit, oldComponents);

    return removed;
  },

  insertEntity(world, entity, archetypeBit, componentObject) {
    world.archetypes[archetypeBit] ??= [];
    world.archetypes[archetypeBit].push(entity);
    world.archetypeMap[entity] = archetypeBit;
    for (let comp in componentObject) {
      world.componentMap[comp] ??= {};
      world.componentMap[comp][entity] = componentObject[comp];
    }
  },

  getComponents(world, entity, components) {
    let result = new Array(components.length);
    for (let i = 0; i < components.length; i++) {
      result[i] = world.componentMap[components[i].id][entity];
    }
    return result;
  },

  hasComponents(world, entity, components) {
    let bit = getCombinedBit(world.compEnum, components);
    return (world.archetypeMap[entity] & bit) === bit;
  },

  filter(world, components) {
    let entities = [];
    let archetypes = world.archetypes;
    let bit = getCombinedBit(world.compEnum, components);
    for (let a in archetypes) {
      if ((bit & a) !== bit) continue;
      entities.push(...archetypes[a]);
    }
    return entities;
  },

  instantiate(world, entity) {
    let e = createEntity();
    let type = world.archetypeMap[e] = world.archetypeMap[entity];
    world.archetypes[type].push(e);
    let cMap = world.componentMap;
    for (let comp in cMap) {
      if (!(world.compEnum[comp] & type)) continue;
      cMap[comp][e] = structuredClone(cMap[comp][entity]);
    }
    return e;
  },

  removeEntity(world, entity) {
    let type = world.archetypeMap[entity];
    let archetype = world.archetypes[type];
    let oldComponents = {};
    let index = findIndex(archetype, entity);
    if (index === -1) return oldComponents;
    archetype.splice(index, 1);
    let cMap = world.componentMap;
    for (let comp in cMap) {
      if (!(world.compEnum[comp] & type)) continue;
      oldComponents[comp] = cMap[comp][entity];
      delete cMap[comp][entity];
    }
    return oldComponents;
  },

  findIndex(archetype, entity) {
    let index = -1;
    for (let i = 0; i < archetype?.length; i++) {
      if (archetype[i] !== entity) continue;
      index = i;
      break;
    }
    return index;
  },

  getCombinedBit(compEnum, components) {
    let bit = 0;
    for (let i = 0; i < components.length; i++) {
      bit += (compEnum[components[i].id] ??= 1 << Object.keys(compEnum).length);
    }
    return bit;
  }
}