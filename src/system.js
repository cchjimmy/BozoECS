export function systemGroup(filter) {
  return (...systems) => (...args) => {
    for (let i = 0; i < systems.length; ++i) {
      systems[i](filter.results, ...args);
    }
  };
}
