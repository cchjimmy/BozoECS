const BozoECS = {};

BozoECS.createWorld = (entities, systems) => {
  let world = {
    compEnum: {}, // for bitmasking
    archetypes: {}, // entity components storage
    archetypeMap: new Map // entity to archetype mapping
  };
  BozoECS.defineSystems(world, systems);
  BozoECS.addEntities(world, entities);
  return world;
};

BozoECS.createSystem = (update = () => { }) => {
  return {
    update
  }
}

BozoECS.createComponent = (properties) => {
  return {
    id: BozoECS.getId(),
    properties
  }
}

BozoECS.getId = () => {
  return crypto.randomUUID();
}

BozoECS.createEntity = () => {
  return {
    id: BozoECS.getId(),
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
  let unique = Object.keys(world.compEnum).length;
  for (let i = 0; i < entities.length; i++) {
    // figure out archetype
    let archetype = 0;
    for (let comp in entities[i].components) {
      if (!world.compEnum[comp]) {
        world.compEnum[comp] = 2 ** unique;
        unique++;
      }
      archetype += world.compEnum[comp];
    }
    
    // compare old archetype if exist
    let oldArchetype = world.archetypeMap.get(entities[i].id);
    
    // skip this entity if old archetype is the same as the current one
    if (oldArchetype == archetype) continue;
    
    // otherwise remove entity from old archetype
    if (oldArchetype) {
      let index = BozoECS.findIndex(world.archetypes[oldArchetype], entities[i]);
      for (let prop in world.archetypes[oldArchetype]) {
        world.archetypes[oldArchetype][prop].splice(index, 1);
      }
      
      // remove old archetype if it does not contain any entities
      if (world.archetypes[oldArchetype].ids.length == 0) delete world.archetypes[oldArchetype]; 
    }
    
    // if current archetype does not exist, create a new one
    world.archetypes[archetype] ??= { ids: [] };

    // find index of entity
    let index = BozoECS.findIndex(world.archetypes[archetype], entities[i]);
    
    // store entity id
    index = index == -1 ? world.archetypes[archetype].ids.push(entities[i].id) - 1 : index;
    
    // store components in archetype;
    for (let comp in entities[i].components) {
      world.archetypes[archetype][comp] ??= [];
      // clone entity components into archetype records
      world.archetypes[archetype][comp][index] = structuredClone(entities[i].components[comp]);
    }
    
    world.archetypeMap.set(entities[i].id, archetype);
  }
}

BozoECS.forEach = (world, components, callback) => {
  // figure out archetype
  let archetype = 0;
  for (let i = 0; i < components.length; i++) {
    archetype += world.compEnum[components[i].id];
  }
  
  // return if archetype does not exist due to components not existing in world.compEnum
  if (!archetype) return;
  
  // search for archetypes with those components
  let comps = {};
  for (let a in world.archetypes) {
    // if archetype does not have all required components then skip
    if ((archetype & a) !== archetype) continue;
    
    // otherwise append components to "comps"
    for (let i = 0; i < components.length; i++) {
      comps[components[i].id] ??= [];
      comps[components[i].id].push(...world.archetypes[a][components[i].id]);
    }
  }
  
  // call the callback function
  for (let i = 0; i < comps[components[0].id].length; i++) {
    let args = new Array(components.length);
    for (let j = 0; j < components.length; j++) {
      args[j] = comps[components[j].id][i];
    }
    callback(...args);
  }
}

BozoECS.instantiate = (entity) => {
  let e = BozoECS.createEntity();
  e.components = structuredClone(entity.components);
  return e;
}

BozoECS.removeEntity = (entity, world) => {
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