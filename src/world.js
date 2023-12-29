export function world(...componentsToRegister) {
  let world = {
    components: {},
    indexMap: new Map(),
    nextIdx: 0,
  };
  for (let i = 0; i < componentsToRegister.length; ++i) {
    world.components[componentsToRegister[i].id] = [];
  }
  return (...filtersToRegister) => {
    world.filters = new Array(filtersToRegister.length);
    for (let i = 0; i < filtersToRegister.length; ++i) {
      world.filters[i] = {
        mask: filtersToRegister[i],
        results: new Set(),
      };
    }
    return world;
  };
}
