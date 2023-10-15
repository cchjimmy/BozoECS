export function filter(...components) {
  let mask = 0;
  for (let i = 0; i < components.length; i++) {
    mask += components[i].id;
  }
  let f = {
    mask,
    results: new Set(),
  };
  return () => f;
}
