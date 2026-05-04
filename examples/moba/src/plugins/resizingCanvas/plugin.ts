import { Plugin } from "../../core/app.ts";
import { setUpCanvas } from "../../core/canvas.ts";

const plug: Plugin = {
  setUp: () => {
    setUpCanvas();
  },
  update: () => {},
};

export default plug;
