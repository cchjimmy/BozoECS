export function systemGroup(filter, world) {
  let entities;
  for (let i = 0; i < world.filters.length; ++i) {
    if (world.filters[i].mask !== filter) continue;
    entities = world.filters[i].results;
  }
  return (...systems) => (...args) => {
    for (let i = 0; i < systems.length; ++i) {
      systems[i](entities, world, ...args);
    }
  };
}
