const componentIdGenerator = function* () {
  let id = 1;
  while (1) {
    yield id;
    id <<= 1;
  }
}();
export function component(properties) {
  return {
    id: componentIdGenerator.next().value,
    properties,
  };
}
export function addComponents(world, entity, ...components) {
  let mask = 0;
  for (let i = 0; i < components.length; i++) {
    let compId = components[i].id;
    let initComponent = world.componentStore[compId].pop() ||
      world.components[compId][entity] ||
      {};
    components[i] = world.components[compId][entity] = Object.assign(
      initComponent,
      components[i].properties,
    );
    mask += compId;
  }
  for (let j = 0; j < world.filters.length; j++) {
    let filter = world.filters[j]();
    filter.mask & mask && filter.results.add(entity);
  }
  return components;
}
export function removeComponents(world, entity, ...components) {
  let mask = 0;
  for (let i = 0; i < components.length; i++) {
    let compId = components[i].id;
    world.componentStore[compId].push(world.components[compId][entity]);
    world.components[compId][entity] = undefined;
    mask += compId;
  }
  for (let j = 0; j < world.filters.length; j++) {
    let filter = world.filters[j]();
    filter.mask & mask && filter.results.delete(entity);
  }
}
export function getComponents(world, entity, ...components) {
  for (let i = 0; i < components.length; i++) {
    let compId = components[i].id;
    components[i] = world.components[compId][entity];
  }
  return components;
}
