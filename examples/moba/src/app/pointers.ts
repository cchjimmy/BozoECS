export function setUpPointers() {
  const pointers: {
    x: number[];
    y: number[];
    pressX: number[];
    pressY: number[];
    releaseX: number[];
    releaseY: number[];
    isDown: boolean[];
    justPressed: boolean[];
    justReleased: boolean[];
  } = {
    x: [],
    y: [],
    pressX: [],
    pressY: [],
    releaseX: [],
    releaseY: [],
    isDown: [],
    justPressed: [],
    justReleased: [],
  };
  globalThis.onpointerdown = (e) => {
    if (e.target != document.querySelector("canvas")) return;
    pointers.x[e.pointerId] = e.x;
    pointers.y[e.pointerId] = e.y;
    pointers.isDown[e.pointerId] = true;
    pointers.justPressed[e.pointerId] = true;
    pointers.pressX[e.pointerId] = e.x;
    pointers.pressY[e.pointerId] = e.y;
  };
  globalThis.onpointerup = (e) => {
    pointers.x[e.pointerId] = e.x;
    pointers.y[e.pointerId] = e.y;
    pointers.isDown[e.pointerId] = false;
    pointers.justReleased[e.pointerId] = true;
    pointers.releaseX[e.pointerId] = e.x;
    pointers.releaseY[e.pointerId] = e.y;
  };
  globalThis.onpointermove = (e) => {
    pointers.x[e.pointerId] = e.x;
    pointers.y[e.pointerId] = e.y;
  };
  return pointers;
}

export function updatePointers(pointers: {
  justPressed: boolean[];
  justReleased: boolean[];
}) {
  for (let i = 0, l = pointers.justPressed.length; i < l; i++) {
    pointers.justPressed[i] = false;
    pointers.justReleased[i] = false;
  }
}
