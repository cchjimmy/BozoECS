const BozoECS = {};

BozoECS.createWorld = (entities, systems) => {
  let world = {
    compEnums: {}, // for bitmasking
    archetypes: {}, // entity components storage
    archetypeMap: new Map // entity to archetype mapping
  };
  BozoECS.defineSystems(world, systems);
  BozoECS.addEntities(world, entities);
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
    properties
  }
}

BozoECS.createEntity = () => {
  return {
    id: crypto.randomUUID(),
    components: {}
  }
}

BozoECS.update = (world, ...args) => {
  for (let i = 0; i < world.systems.length; i++) {
    world.systems[i].update(world, ...args);
  }
}

BozoECS.addComponents = (entity, components) => {
  for (let i = 0; i < components.length; i++) {
    entity.components[components[i].id] = structuredClone(components[i].properties);
  }
}

BozoECS.removeComponents = (entity, components) => {
  for (let i = 0; i < components.length; i++) {
    delete entity.components[components[i].id];
  }
}

BozoECS.getComponents = (entity, components) => {
  let result = new Array(components.length);
  for (let i = 0; i < components.length; i++) {
    result[i] = entity.components[components[i].id];
  }
  return result;
}

BozoECS.hasComponents = (entity, components) => {
  for (let i = 0; i < components.length; i++) {
    if (!entity.components.hasOwnProperty(components[i].id)) return false;
  }
  return true;
}

BozoECS.defineSystems = (world, systems) => {
  world.systems = systems;
}

BozoECS.addEntities = (world, entities) => {
  let unique = Object.keys(world.compEnums).length;

  for (let i = 0; i < entities.length; i++) {
    // figure out archetype
    let archetype = 0;
    for (let comp in entities[i].components) {
      if (!world.compEnums[comp]) {
        world.compEnums[comp] = 2 ** unique;
        unique++;
      }
      archetype += world.compEnums[comp];
    }

    // if current archetype does not exist, create a new one
    if (!world.archetypes[archetype]) {
      world.archetypes[archetype] = { ids: [] };

      for (let comp in entities[i].components) {
        world.archetypes[archetype][comp] = [];
      }
    }

    // compare old archetype if exist
    let oldArchetype = world.archetypeMap.get(entities[i].id);

    let index;

    if (oldArchetype != archetype) {
      // remove entity from old archetype if it is different from current archetype
      if (!isNaN(oldArchetype)) {
        index = BozoECS.findIndex(world.archetypes[oldArchetype], entities[i]);

        for (let prop in world.archetypes[oldArchetype]) {
          world.archetypes[oldArchetype][prop].splice(index, 1);
        }

        // remove old archetype if it does not contain any entities
        if (world.archetypes[oldArchetype].ids.length == 0) delete world.archetypes[oldArchetype];
      }

      // store entity id
      index = world.archetypes[archetype].ids.push(entities[i].id) - 1;

      world.archetypeMap.set(entities[i].id, archetype);
    } else {
      index = BozoECS.findIndex(world.archetypes[archetype], entities[i]);
    }

    // store components in archetype;
    for (let comp in entities[i].components) {
      // clone entity components into archetype records
      world.archetypes[archetype][comp][index] = structuredClone(entities[i].components[comp]);
    }
  }
}

BozoECS.getComponentLists = (world, components) => {
  // figure out archetype
  let archetype = 0;
  for (let i = 0; i < components.length; i++) {
    archetype += world.compEnums[components[i].id];
  }

  // return if archetype does not exist due to components not existing in world.compEnums or it is an archetype with no components
  if (!archetype) return;

  // search for archetypes with those components
  let comps = new Array(components.length);
  for (let a in world.archetypes) {
    // if archetype does not have all required components then skip
    if ((archetype & a) !== archetype) continue;
    // otherwise append components to "comps"
    for (let i = 0; i < components.length; i++) {
      comps[i] ??= [];
      comps[i].push(...world.archetypes[a][components[i].id]);
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

BozoECS.instantiate = (entity) => {
  let e = BozoECS.createEntity();
  e.components = structuredClone(entity.components);
  return e;
}

BozoECS.removeEntity = (world, entity) => {
  let archetype = world.archetypeMap.get(entity.id);
  if (isNaN(archetype)) return;
  let index = BozoECS.findIndex(world.archetypes[archetype], entity);
  for (let prop in world.archetypes[archetype]) {
    world.archetypes[archetype][prop].splice(index, 1);
  }
}

BozoECS.findIndex = (archetype, entity) => {
  let index = -1;
  for (let i = 0; i < archetype.ids.length; i++) {
    if (archetype.ids[i] != entity.id) continue;
    index = i;
    break;
  }
  return index;
}

export default BozoECS;