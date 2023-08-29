var store = {
  entities: [],
  components: {},
};

function createWorld() {
  return {
    archetypes: [],
    archetypeMap: [], // entity to archetype mapping
    componentMap: [],
  };
}

function createSystem(update = () => {}) {
  return {
    update,
  };
}

const compIdGenerator = (function* () {
  var count = 0;
  while (true) {
    yield (() => {
      let id = 1 << count;
      count++;
      return id;
    })();
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
    yield store.entities.length
      ? store.entities.pop()
      : (() => {
          let id = nextId;
          nextId++;
          return id;
        })();
  }
})();

function createEntity() {
  return entityIdGenerator.next().value;
}

function update(systems, ...args) {
  systems.forEach((system) => {
    system.update(...args);
  });
}

function addComponents(world, entity, components) {
  let type = world.archetypeMap[entity];
  removeFromArchetype(world.archetypes[type], entity);
  type |= getCombinedBit(components);
  world.archetypeMap[entity] = type;
  (world.archetypes[type] ??= []).push(entity);
  for (let i = 0; i < components.length; i++) {
    // reset existing component || add a new record
    let id = components[i].id;
    let comp = ((world.componentMap[id] ??= [])[entity] ??=
      store.components[components[i].id]?.pop() || {});
    Object.assign(comp, components[i].properties);
    components[i] = comp;
  }
  return components;
}

function removeComponents(world, entity, components) {
  let type = world.archetypeMap[entity];
  removeFromArchetype(world.archetypes[type], entity);
  type &= ~getCombinedBit(components);
  world.archetypeMap[entity] = type;
  (world.archetypes[type] ??= []).push(entity);
  for (let i = 0; i < components.length; i++) {
    let id = components[i].id;
    (store.components[id] ??= []).push(
      (components[i] = world.componentMap[id][entity]),
    );
    delete world.componentMap[id][entity];
  }
  return components;
}

function getComponents(world, entity, components) {
  for (let i = 0; i < components.length; i++) {
    components[i] = world.componentMap[components[i].id][entity];
  }
  return components;
}

function hasComponent(world, entity, component) {
  return world.archetypeMap[entity] & component.id;
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
  if (entity == undefined) return;
  let type = world.archetypeMap[entity];
  delete world.archetypeMap[entity];
  removeFromArchetype(world.archetypes[type], entity);
  store.entities.push(entity);
  let cMap = world.componentMap;
  for (let comp in cMap) {
    let bit = Number.parseInt(comp);
    if (!(type & bit)) continue;
    (store.components[bit] ??= []).push(cMap[bit][entity]);
    delete cMap[bit][entity];
  }
}

function removeFromArchetype(archetype, entity) {
  let index = archetype?.indexOf(entity) ?? -1;
  if (index == -1) return;
  archetype.splice(index, 1);
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
  hasComponent,
  filter,
  removeEntity,
};
