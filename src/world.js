export function world(...componentsToRegister) {
  return (...filtersToRegister) => {
    let world = {
      components: {},
      filters: filtersToRegister,
      indexMap: new Map,
      nextIdx: 0,
    };
    for (let i = 0; i < componentsToRegister.length; i++) {
      world.components[componentsToRegister[i].id] = [];
    }
    return world;
  };
}
