export function world(...componentsToRegister) {
  return (...filtersToRegister) => {
    let world = {
      components: {},
      indexMap: new Map(),
      nextIdx: 0,
      filters: new Array(filtersToRegister.length),
    };
    for (let i = 0; i < componentsToRegister.length; ++i) {
      world.components[componentsToRegister[i].id] = [];
    }
    for (let i = 0; i < filtersToRegister.length; ++i) {
      world.filters[i] = {
        mask: filtersToRegister[i],
        results: new Set(),
      };
    }
    return world;
  };
}
