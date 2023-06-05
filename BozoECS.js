const BozoECS = {};

BozoECS.createWorld = (entities, systems) => {
  let world = {};
  BozoECS.defineSystems(world, systems);
  BozoECS.addEntities(world, entities);
  return world;
};

BozoECS.createSystem = (update = () => { }) => {
  return {
    update
  }
}

BozoECS.createComponent = (name, properties) => {
  return {
    name,
    properties,
  }
}

BozoECS.nextId = 0;

BozoECS.createEntity = () => {
  return {
    id: BozoECS.nextId++,
    components: {}
  }
}

BozoECS.update = (world) => {
  for (let i = 0; i < world.systems.length; i++) {
    world.systems[i].update(world);
  }
}

BozoECS.addComponents = (entity, components) => {
  for (let i = 0; i < components.length; i++) {
    entity.components[components[i].name] = structuredClone(components[i].properties);
  }
}

BozoECS.removeComponents = (entity, components) => {
  for (let i = 0; i < components.length; i++) {
    delete entity.components[components[i].name];
  }
}

BozoECS.getComponents = (entity, components) => {
  let result = new Array(components.length);
  for (let i = 0; i < components.length; i++) {
    result[i] = entity.components[components[i].name];
  }
  return result;
}

BozoECS.hasComponents = (entity, components) => {
  for (let i = 0; i < components.length; i++) {
    if (!entity.components.hasOwnProperty(components[i].name)) return false;
  }
  return true;
}

BozoECS.defineSystems = (world, systems) => {
  world.systems = systems;
}

BozoECS.addEntities = (world, entities) => {
  world.compEnum ??= {}; // for bitmasking
  world.archetypes ??= {}; // entity components storage
  world.archetypeMap ??= new Map;
  
  let unique = 0;
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
      let index = findIndex(world.archetypes[oldArchetype], entities[i].id);
      for (let prop in world.archetypes[oldArchetype]) {
        world.archetypes[oldArchetype][prop].splice(index, 1);
      }
    }
    
    // if current archetype does not exist, create a new one
    world.archetypes[archetype] ??= { ids: [] };

    // find index of entity
    let index = findIndex(world.archetypes[archetype], entities[i].id);
    
    // store entity id
    index = index == -1 ? world.archetypes[archetype].ids.push(entities[i].id) - 1 : index;
    
    // store components in archetype;
    for (let comp in entities[i].components) {
      world.archetypes[archetype][comp] ??= [];
      world.archetypes[archetype][comp][index] = entities[i].components[comp];
    }
    
    world.archetypeMap.set(entities[i].id, archetype);
  }
  
  function findIndex(archetype, entityId) {
    let index = -1;
    for (let i = 0; i < archetype.ids.length; i++) {
      if (archetype.ids[i] !== entityId) continue;
      index = i;
      break;
    }
    return index;
  }
}

BozoECS.forEach = (world, components, callback) => {
  // figure out archetype
  let archetype = 0;
  for (let i = 0; i < components.length; i++) {
    archetype += world.compEnum[components[i].name];
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
      comps[components[i].name] ??= [];
      comps[components[i].name].push(...world.archetypes[a][components[i].name]);
    }
  }
  
  // call the callback function
  for (let i = 0; i < comps[components[0].name].length; i++) {
    let args = new Array(components.length);
    for (let j = 0; j < components.length; j++) {
      args[j] = comps[components[j].name][i];
    }
    callback(...args);
  }
}

BozoECS.instantiate = (entity) => {
  let e = BozoECS.createEntity();
  e.components = structuredClone(entity.components);
  return e;
}

export default BozoECS;