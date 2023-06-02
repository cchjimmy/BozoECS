const BozoECS = {};

BozoECS.createWorld = (systems, init = () => {}) => {
  return {
    init,
    systems,
    animationRequest: null
  };
};

BozoECS.createSystem = (update = () => {}) => {
  return {
    update
  };
}

BozoECS.createComponent = (name, properties) => {
  return {
    name,
    properties
  }
}

BozoECS.nextId = -1;

BozoECS.createEntities = (amount = 1) => {
  let entities = new Array(amount);
  for (let i = 0; i < amount; i++) {
    BozoECS.nextId++;
    entities[i] = {
      id: BozoECS.nextId,
      components: new Map
    };
  }
  return entities;
}

BozoECS.simulate = (world, initialize = true) => {
  if (initialize) {
    world.archetypes = {};
    let entities = world.init();
    
    world.entities = structuredClone(entities);
  }
  
  let last = performance.now();
  world.deltaTime = 0;
  
  let update = () => {
    for (let i = 0; i < world.systems.length; i++) {
      world.systems[i].update(world);
    }
    
    world.deltaTime = performance.now() - last;
    last += world.deltaTime;
    
    world.animationRequest = requestAnimationFrame(update);
  }
  
  update();
}

BozoECS.pause = (world) => {
  cancelAnimationFrame(world.animationRequest);
}

BozoECS.addComponent = (entity, component) => {
  entity.components.set(component.name, structuredClone(component.properties));
}

BozoECS.removeComponent = (entity, component) => {
  entity.components.delete(component.name);
}

BozoECS.getComponent = (entity, component) => {
  return entity.components.get(component.name);
}

BozoECS.forEach = (components, world, callback) => {
  let result = new Array(components.length);
  for (let i = 0; i < components.length; i++) {
    result[i] = world.components[components[i].name];
  }
  return result;
}

BozoECS.sortIntoArchetype = (entity, world) => {
  
}

export default BozoECS;