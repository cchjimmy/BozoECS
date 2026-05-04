import { Plugin } from "../../core/app.ts";
import { updateKeyboard } from "../../core/keys.ts";
import keyboard from "./api.ts";

const plug: Plugin = {
  setUp: () => {},
  update: () => {
    updateKeyboard(keyboard);
  },
};

export default plug;
