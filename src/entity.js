const entityIdGenerator = function* () {
  let id = 0;
  while (1) {
    yield id;
    id++;
  }
}();
export function entity() {
  return entityIdGenerator.next().value;
}
