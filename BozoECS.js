const BozoECS = {};

BozoECS.createWorld = () => {
  return {};
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

BozoECS.attach = (entities, systems, world) => {
  world.entities = [...entities];
  world.systems = [...systems];
}

BozoECS.hasComponent = (entity, component) => {
  return entity.components.hasOwnProperty(component.name);
}

export default BozoECS;