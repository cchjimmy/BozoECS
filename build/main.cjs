var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/exports.js
var exports_exports = {};
__export(exports_exports, {
  addComponents: () => addComponents,
  component: () => component,
  entity: () => entity,
  filter: () => filter,
  getComponents: () => getComponents,
  removeComponents: () => removeComponents,
  removeEntity: () => removeEntity,
  system: () => system,
  world: () => world
});
module.exports = __toCommonJS(exports_exports);

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
function removeEntity(world2, entity2) {
  let mask = 0;
  for (let i = 0; i < world2.components.length; i++) {
    world2.components[i] && world2.components[i][entity2] && (() => {
      world2.componentStore[i].push(world2.components[i][entity2]);
      world2.components[i][entity2] = void 0;
      mask += i;
    })();
  }
  for (let i = 0; i < world2.filters.length; i++) {
    let filter2 = world2.filters[i]();
    filter2.mask & mask && filter2.results.delete(entity2);
  }
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
  let mask = 0;
  for (let i = 0; i < components.length; i++) {
    let compId = components[i].id;
    let initComponent = world2.componentStore[compId].pop() || world2.components[compId][entity2] || {};
    components[i] = world2.components[compId][entity2] = Object.assign(
      initComponent,
      components[i].properties
    );
    mask += compId;
  }
  for (let j = 0; j < world2.filters.length; j++) {
    let filter2 = world2.filters[j]();
    filter2.mask & mask && filter2.results.add(entity2);
  }
  return components;
}
function removeComponents(world2, entity2, ...components) {
  let mask = 0;
  for (let i = 0; i < components.length; i++) {
    let compId = components[i].id;
    world2.componentStore[compId].push(world2.components[compId][entity2]);
    world2.components[compId][entity2] = void 0;
    mask += compId;
  }
  for (let j = 0; j < world2.filters.length; j++) {
    let filter2 = world2.filters[j]();
    filter2.mask & mask && filter2.results.delete(entity2);
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
      (e) => modules.reduce((output, module2) => module2(output), e)
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
