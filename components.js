import BozoECS from "./BozoECS.js";

export const position = BozoECS.createComponent({
  x: 0,
  y: 0
});

export const velocity = BozoECS.createComponent({
  x: 0,
  y: 0
});

export const acceleration = BozoECS.createComponent({
  x: 0,
  y: -981
})

export const appearance = BozoECS.createComponent({
  color: "black",
  radius: 10
})

export const time = BozoECS.createComponent({
  value: 0
})

export const spawn = BozoECS.createComponent({
  x: 0,
  y: 0
})