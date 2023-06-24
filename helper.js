export function random(min, max) {
  return Math.random() * (max - min) + min;
}

export function distance(a, b) {
  return ((b.x - a.x) ** 2 + (b.y - a.y) ** 2) ** 0.5;
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function direction(a, b) {
  let result = subtract(structuredClone(b), a);
  normalize(result);
  return result;
}

export function normalize(a) {
  let m = mag(a);
  a.x /= m;
  a.y /= m;
  return a;
}

export function mag(a) {
  return dot(a, a) ** 0.5;
}

export function multS(a, scaler) {
  a.x *= scaler;
  a.y *= scaler;
  return a;
}

export function subtract(a, b) {
  a.x -= b.x;
  a.y -= b.y;
  return a;
}

export function add(a, b) {
  a.x += b.x;
  a.y += b.y;
  return a;
}

export function setMag(a, mag) {
  normalize(a);
  multS(a, mag);
  return a;
}