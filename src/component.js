const componentIdGenerator = (function* () {
  let id = 1;
  while (1) {
    yield id;
    id <<= 1;
  }
})();
export function component(properties) {
  return {
    id: componentIdGenerator.next().value,
    properties,
  };
}
export function addComponent(world, entity, component) {
  const idx = world.indexMap.get(entity) ?? (() => {
    let i = world.nextIdx++;
    world.indexMap.set(entity, i);
    return i;
  })();
  const c = world
    .components[component.id][idx] ??= {};
  for (let p in component.properties) {
    c[p] = component.properties[p];
  }
  for (let i = 0; i < world.filters.length; i++) {
    if (world.filters[i].mask & component.id) {
      world.filters[i].results.add(entity);
    }
  }
  return c;
}
export function removeComponent(world, entity, component) {
  for (let i = 0; i < world.filters.length; i++) {
    if (world.filters[i].mask & component.id) {
      world.filters[i].results.delete(entity);
    }
  }
}
export function getComponent(world, entityPtr, component) {
  return world.components[component.id][entityPtr];
}
