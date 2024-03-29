// src/world.js
function world(...componentsToRegister) {
  return (...filtersToRegister) => {
    let world2 = {
      components: {},
      indexMap: /* @__PURE__ */ new Map(),
      nextIdx: 0,
      filters: new Array(filtersToRegister.length),
      componentMasks: {}
    };
    for (let i = 0; i < componentsToRegister.length; ++i) {
      world2.components[componentsToRegister[i].id] = [];
    }
    for (let i = 0; i < filtersToRegister.length; ++i) {
      world2.filters[i] = {
        mask: filtersToRegister[i],
        results: /* @__PURE__ */ new Set()
      };
    }
    return world2;
  };
}

// src/entity.js
function entity() {
  return parseInt(Math.random() * 2 ** 64);
}
function removeEntity(world2, entity2) {
  let mask = 0;
  for (let i = 0; i < world2.components.length; i++) {
    world2.components[i] && world2.components[i][entity2] && (mask += i);
  }
  for (let i = 0; i < world2.filters.length; i++) {
    world2.filters[i].mask & mask && world2.filters[i].results.delete(entity2);
  }
}
function getEntityPointer(world2, entity2) {
  return world2.indexMap.get(entity2);
}

// src/filter.js
function filter(...components) {
  let mask = 0;
  for (let i = 0; i < components.length; i++) {
    mask += components[i].id;
  }
  return mask;
}
function getResults(world2, filter2) {
  for (let i = 0; i < world2.filters.length; ++i) {
    if (world2.filters[i].mask != filter2)
      continue;
    return world2.filters[i].results;
  }
}

// src/system.js
function systemGroup(...systems) {
  return (...args) => {
    for (let i = 0; i < systems.length; ++i) {
      systems[i](...args);
    }
  };
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
function addComponent(world2, entity2, component2) {
  const idx = world2.indexMap.get(entity2) ?? (() => {
    let i = world2.nextIdx++;
    world2.indexMap.set(entity2, i);
    return i;
  })();
  const c = world2.components[component2.id][idx] ??= {};
  for (let p in component2.properties) {
    c[p] = component2.properties[p];
  }
  const mask = world2.componentMasks[idx] |= component2.id;
  for (let i = 0; i < world2.filters.length; i++) {
    if (!(world2.filters[i].mask & ~mask)) {
      world2.filters[i].results.add(entity2);
    }
  }
  return c;
}
function removeComponent(world2, entity2, component2) {
  const idx = world2.indexMap.get(entity2);
  world2.componentMasks[idx] &= ~component2.id;
  for (let i = 0; i < world2.filters.length; i++) {
    if (world2.filters[i].mask & component2.id) {
      world2.filters[i].results.delete(entity2);
    }
  }
}
function getComponent(world2, entityPtr, component2) {
  return world2.components[component2.id][entityPtr];
}
export {
  addComponent,
  component,
  entity,
  filter,
  getComponent,
  getEntityPointer,
  getResults,
  removeComponent,
  removeEntity,
  systemGroup,
  world
};
