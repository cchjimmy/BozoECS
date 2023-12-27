export function entity() {
  return parseInt(Math.random() * (2 ** 64));
}
export function removeEntity(world, entity) {
  let mask = 0;
  for (let i = 0; i < world.components.length; i++) {
    world.components[i] &&
      world.components[i][entity] && (mask += i);
  }
  for (let i = 0; i < world.filters.length; i++) {
    world.filters[i].mask & mask && world.filters[i].results.delete(entity);
  }
}
export function getEntityPointer(world, entity) {
  return world.indexMap.get(entity);
}
