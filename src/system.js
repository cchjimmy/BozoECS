function systemGroup(...systems) {
  return (...args) => {
    for (let i = 0; i < systems.length; ++i) {
      systems[i](...args);
    }
  };
}
export { systemGroup };
