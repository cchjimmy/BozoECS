const entityIdGenerator = function* () {
  let id = 0;
  while (1) {
    yield id;
    id++;
  }
}();
export function entity() {
  return entityIdGenerator.next().value;
}
export function removeEntity(world, entity) {
  let mask = 0;
  for (let i = 0; i < world.components.length; i++) {
    world.components[i] && world.components[i][entity] &&
      (() => {
        world.componentStore[i].push(world.components[i][entity]);
        world.components[i][entity] = undefined;
        mask += i;
      })();
  }
  for (let i = 0; i < world.filters.length; i++) {
    let filter = world.filters[i]();
    filter.mask & mask && filter.results.delete(entity);
  }
}
