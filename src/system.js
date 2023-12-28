export function system(filter) {
  let entities = filter.results;
  return (...modules) => (...args) => {
    let input = [entities, ...args];
    for (let i = 0; i < modules.length; i++) {
      input = modules[i](...input);
    }
  };
}
