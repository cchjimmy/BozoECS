import BozoECS from "../BozoECS.js";
import { position, velocity, appearance, ctx2d } from "./components.js";

export const base = BozoECS.createEntity();

BozoECS.addComponents(base, [position, velocity, appearance]);

export const ctx = BozoECS.createEntity();

BozoECS.addComponents(ctx, [ctx2d]);