const BozoECS = {};

BozoECS.createWorld = (entities, systems) => {
  let world = {};
  BozoECS.defineSystems(world, systems);
  BozoECS.defineEntities(world, entities);
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

BozoECS.defineEntities = (world, entities) => {
  world.entities = entities;
}

export default BozoECS;