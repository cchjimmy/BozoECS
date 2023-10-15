// src/world.js
function world(...componentsToRegister) {
  let world2 = {
    components: [],
    componentStore: []
  };
  for (let i = 0; i < componentsToRegister.length; i++) {
    world2.components[componentsToRegister[i].id] = [];
    world2.componentStore[componentsToRegister[i].id] = [];
  }
  return (...filtersToRegister) => {
    world2.filters = filtersToRegister;
    return world2;
  };
}

// src/entity.js
var entityIdGenerator = function* () {
  let id = 0;
  while (1) {
    yield id;
    id++;
  }
}();
function entity() {
  return entityIdGenerator.next().value;
}

// src/component.js
var componentIdGenerator = function* () {
  let id = 1;
  while (1) {
    yield id;
    id <<= 1;
  }
}();
function component(properties) {
  return {
    id: componentIdGenerator.next().value,
    properties
  };
}
function addComponents(world2, entity2, ...components) {
  for (let i = 0; i < components.length; i++) {
    let compId = components[i].id;
    let initComponent = world2.componentStore[compId].pop() || world2.components[compId][entity2] || {};
    for (let j = 0; j < world2.filters.length; j++) {
      let filter2 = world2.filters[j]();
      filter2.mask & compId && filter2.results.add(entity2);
    }
    components[i] = world2.components[compId][entity2] = Object.assign(
      initComponent,
      components[i].properties
    );
  }
  return components;
}
function removeComponents(world2, entity2, ...components) {
  for (let i = 0; i < components.length; i++) {
    let compId = components[i].id;
    for (let j = 0; j < world2.filters.length; j++) {
      let filter2 = world2.filters[j]();
      filter2.mask & compId && filter2.results.delete(entity2);
    }
    world2.componentStore[compId].push(world2.components[compId][entity2]);
    world2.components[compId][entity2] = void 0;
  }
}
function getComponents(world2, entity2, ...components) {
  for (let i = 0; i < components.length; i++) {
    let compId = components[i].id;
    components[i] = world2.components[compId][entity2];
  }
  return components;
}

// src/system.js
function system(filter2) {
  let entities = filter2().results;
  return (...modules) => () => {
    entities.forEach(
      (e) => modules.reduce((output, module) => module(output), e)
    );
  };
}

// src/filter.js
function filter(...components) {
  let mask = 0;
  for (let i = 0; i < components.length; i++) {
    mask += components[i].id;
  }
  let f = {
    mask,
    results: /* @__PURE__ */ new Set()
  };
  return () => f;
}
export {
  addComponents,
  component,
  entity,
  filter,
  getComponents,
  removeComponents,
  system,
  world
};
