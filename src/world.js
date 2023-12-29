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
    world.filters = filtersToRegister;
    return world;
  };
}
