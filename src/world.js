export function world(...componentsToRegister) {
  let world = {
    components: [],
    componentStore: [],
  };
  for (let i = 0; i < componentsToRegister.length; i++) {
    world.components[componentsToRegister[i].id] = [];
    world.componentStore[componentsToRegister[i].id] = [];
  }
  return (...filtersToRegister) => {
    world.filters = filtersToRegister;
    return world;
  };
}
