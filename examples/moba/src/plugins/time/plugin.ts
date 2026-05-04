import { Plugin } from "../../core/app.ts";
import { updateTime } from "../../core/time.ts";
import time from "./api.ts";

const plug: Plugin = {
  setUp: () => {},
  update: () => {
    updateTime(time);
  },
};

export default plug;
