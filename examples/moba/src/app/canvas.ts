function initWindowStyles() {
  const styles = document.createElement("style");

  styles.innerHTML = `
		html,
		body {
			color: white;
			margin: 0px;
			padding: 0px;
			overflow: hidden;
			width: 100%;
			height: 100%;
			background-color: #181818;
			touch-action: none;
			user-select: none;
		}
		`;

  document.head.appendChild(styles);
}

function fitCanvasIn(elm: HTMLElement, canvas: HTMLCanvasElement) {
  elm.appendChild(canvas);

  elm.onresize = elm.onload = () => {
    if (elm.clientWidth / elm.clientHeight < canvas.width / canvas.height) {
      canvas.style.width = "100%";
      canvas.style.height = "";
    } else {
      canvas.style.width = "";
      canvas.style.height = "100%";
    }
  };

  canvas.style.position = "relative";
  canvas.style.top = "50%";
  canvas.style.left = "50%";
  canvas.style.transform = "translate(-50%, -50%)";
}

function initCanvas(): HTMLCanvasElement {
  return document.querySelector("canvas") ?? document.createElement("canvas");
}

type contextIds = "2d" | "webgl" | "webgl2" | "webgpu" | "bitmaprenderer";
type renderingContext<T extends contextIds> = T extends "2d"
  ? CanvasRenderingContext2D
  : T extends "webgl"
    ? WebGLRenderingContext
    : T extends "webgl2"
      ? WebGL2RenderingContext
      : T extends "webgpu"
        ? GPUCanvasContext
        : T extends "bitmaprenderer"
          ? ImageBitmapRenderingContext
          : RenderingContext;

export function setUpCanvasAPI(
  contextId: "2d",
  canvasParent?: HTMLElement,
): { canvas: HTMLCanvasElement; ctx: renderingContext<"2d"> };

export function setUpCanvasAPI(
  contextId: "webgl",
  canvasParent?: HTMLElement,
): { canvas: HTMLCanvasElement; ctx: renderingContext<"webgl"> };

export function setUpCanvasAPI(
  contextId: "webgl2",
  canvasParent?: HTMLElement,
): { canvas: HTMLCanvasElement; ctx: renderingContext<"webgl2"> };

export function setUpCanvasAPI(
  contextId: "webgpu",
  canvasParent?: HTMLElement,
): { canvas: HTMLCanvasElement; ctx: renderingContext<"webgpu"> };

export function setUpCanvasAPI(
  contextId: "bitmaprenderer",
  canvasParent?: HTMLElement,
): { canvas: HTMLCanvasElement; ctx: renderingContext<"bitmaprenderer"> };

export function setUpCanvasAPI(
  contextId: contextIds = "2d",
  canvasParent: HTMLElement = document.body,
): {
  canvas: HTMLCanvasElement;
  ctx: renderingContext<typeof contextId>;
} {
  const canvas = initCanvas();
  initWindowStyles();
  fitCanvasIn(canvasParent, canvas);
  const ctx = canvas.getContext(contextId);
  if (ctx == null) throw new Error("Cannot initialize context.");
  return { canvas, ctx };
}
