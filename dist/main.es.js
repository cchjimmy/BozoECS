var store = {
  entities: [],
  components: [],
};

function createWorld() {
  return {
    archetypeMap: [], // entity to archetype mapping
    componentMap: [],
    archetypes: [],
  };
}

function createSystem(update = () => {}) {
  return { update };
}

const compIdGenerator = (function* () {
  var id = 1;
  while (true) {
    yield id;
    id <<= 1;
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
  let type = (world.archetypeMap[entity] ??= 0);
  type |= getCombinedBit(components);
  moveEntity(world, entity, world.archetypeMap[entity], type);
  let cMap = world.componentMap;
  for (let i = 0; i < components.length; i++) {
    // reset existing component || create a new one
    let id = components[i].id;
    let comp = ((cMap[id] ??= [])[entity] ??=
      store.components[id]?.pop() || {});
    Object.assign(comp, components[i].properties);
    components[i] = comp;
  }
  return components;
}

function removeComponents(world, entity, components) {
  let type = world.archetypeMap[entity];
  type &= ~getCombinedBit(components);
  moveEntity(world, entity, world.archetypeMap[entity], type);
  let cMap = world.componentMap;
  for (let i = 0; i < components.length; i++) {
    let id = components[i].id;
    (store.components[id] ??= []).push((components[i] = cMap[id][entity]));
    delete cMap[id][entity];
  }
}

function moveEntity(world, entity, typeBefore, typeAfter) {
  let archtypes = world.archetypes;
  let old = (archtypes[typeBefore] ??= []);
  let index = old.indexOf(entity);
  (archtypes[typeAfter] ??= []).push(
    index == -1 ? entity : old.splice(index, 1)[0],
  );
  world.archetypeMap[entity] = typeAfter;
}

function getComponents(world, entity, components) {
  for (let i = 0; i < components.length; i++) {
    components[i] = world.componentMap[components[i].id][entity];
  }
  return components;
}

function hasComponent(world, entity, component) {
  return !!(world.archetypeMap[entity] & component.id);
}

function filter(world, components, callback) {
  let bit = getCombinedBit(components);
  for (let a in world.archetypes) {
    if ((a & bit) !== bit) continue;
    let archetype = world.archetypes[a];
    for (let i = 0; i < archetype.length; i++) {
      callback(archetype[i]);
    }
  }
}

function removeEntity(world, entity) {
  let type = world.archetypeMap[entity];
  if (!type) return;
  world.archetypes[type].splice(world.archetypes[type].indexOf(entity), 1);
  world.archetypeMap[entity] = 0;
  store.entities.push(entity);
  let cMap = world.componentMap;
  for (let comp in cMap) {
    if (!(type & comp)) continue;
    (store.components[comp] ??= []).push(cMap[comp][entity]);
    delete cMap[comp][entity];
  }
}

function getCombinedBit(components) {
  let bit = 0;
  for (let i = 0; i < components.length; i++) {
    bit += components[i].id;
  }
  return bit;
}

export {
  addComponents,
  createComponent,
  createEntity,
  createSystem,
  createWorld,
  filter,
  getComponents,
  hasComponent,
  removeComponents,
  removeEntity,
  update,
};
