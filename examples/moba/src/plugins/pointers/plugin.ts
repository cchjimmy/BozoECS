import { Plugin } from "../../core/app.ts";
import { updatePointers } from "../../core/pointers.ts";
import pointers from "./api.ts";

const plug: Plugin = {
  setUp: () => {},
  update: () => {
    updatePointers(pointers);
  },
};

export default plug;
