export function system(filter) {
  let entities = filter().results;
  return (...modules) => () => {
    entities.forEach((e) =>
      modules.reduce((output, module) => module(output), e)
    );
  };
}
