function filter(...components) {
  let mask = 0;
  for (let i = 0; i < components.length; i++) {
    mask += components[i].id;
  }
  return mask;
}
function getResults(world, filter) {
  for (let i = 0; i < world.filters.length; ++i) {
    if (world.filters[i].mask != filter) continue;
    return world.filters[i].results;
  }
}

export { filter, getResults };
