import BozoECS from "../BozoECS.js";

export const position = BozoECS.createComponent({
  x: 0,
  y: 0
});

export const velocity = BozoECS.createComponent({
  x: 0,
  y: 0
});

export const appearance = BozoECS.createComponent({
  color: "black",
  radius: 10
})

export const playerTag = BozoECS.createComponent();

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

export const ctx2d = BozoECS.createComponent({
  canvas,
  ctx
}, true);