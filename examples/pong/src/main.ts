import { Component, entityT, World } from "../../../src/index.ts";
import { default as config } from "./config.json" with { type: "json" };

const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext("2d");

// components
class Rect extends Component {
	width = 1;
	height = 1;
	color = "white";
}
class Position extends Component {
	x = 0;
	y = 0;
}
class Velocity extends Component {
	x = 0;
	y = 0;
}
class Text extends Component {
	content = "";
	fontSize = 20;
	margin = 3;
	color = "black";
	backgroundColor = "white";
}
class PlayerControl extends Component {
	isLeft = true;
}

// world
const w = new World();

World
	.registerComponent(Rect)
	.registerComponent(Velocity)
	.registerComponent(Position)
	.registerComponent(Text)
	.registerComponent(PlayerControl);

// systems
function handlePlayerControl(world: World) {
	world.query({ and: [Velocity, PlayerControl] }).forEach((e) => {
		const v = world.getComponent(e, Velocity);
		const pc = world.getComponent(e, PlayerControl);
		v.y = 0;
		if (pc.isLeft) {
			if (keys["w"]) {
				v.y += -config.paddle.speed;
			}
			if (keys["s"]) {
				v.y += config.paddle.speed;
			}
		} else {
			if (keys["ArrowUp"]) {
				v.y += -config.paddle.speed;
			}
			if (keys["ArrowDown"]) {
				v.y += config.paddle.speed;
			}
		}
	});
}

function drawBackgound() {
	if (!ctx || !canvas) return;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function move(world: World, dt: number) {
	const ballV = world.getComponent(ball, Velocity);
	ballV.x += dt;
	ballV.y += dt;
	world.query({ and: [Position, Velocity] }).forEach((e) => {
		const p = world.getComponent(e, Position);
		const v = world.getComponent(e, Velocity);
		p.x += v.x * dt;
		p.y += v.y * dt;
	});
}

function drawRects(world: World) {
	if (!ctx) return;
	world.query({ and: [Rect, Position] }).forEach((e) => {
		const p = world.getComponent(e, Position);
		const r = world.getComponent(e, Rect);
		const old = ctx.fillStyle;
		ctx.fillStyle = r.color;
		ctx.fillRect(
			Math.floor(p.x - r.width * 0.5),
			Math.floor(p.y - r.height * 0.5),
			r.width,
			r.height,
		);
		ctx.fillStyle = old;
	});
}

function drawTexts(world: World, dt: number) {
	if (!ctx) return;
	world.query({ and: [Text, Position] }).forEach((e) => {
		const t = world.getComponent(e, Text);
		const p = world.getComponent(e, Position);

		ctx.font = `${t.fontSize}px serif`;
		const txtMetric = ctx.measureText(t.content);
		const old = ctx.fillStyle;
		ctx.fillStyle = t.backgroundColor;
		ctx.fillRect(
			p.x,
			p.y,
			t.margin * 2 + txtMetric.width,
			t.margin * 2 + txtMetric.fontBoundingBoxAscent,
		);
		ctx.fillStyle = t.color;
		ctx.fillText(
			t.content,
			p.x + t.margin,
			p.y + t.margin + txtMetric.fontBoundingBoxAscent,
		);
		ctx.fillStyle = old;
	});
}

function checkCollision(world: World) {
	const entities = world.query({
		and: [Position, Rect],
	});
	entities.forEach((e) => {
		const p = world.getComponent(e, Position);
		const r = world.getComponent(e, Rect);
		entities.forEach((other) => {
			if (other == e) return;
			const p1 = world.getComponent(other, Position);
			const r1 = world.getComponent(other, Rect);
			if (
				(p.x - p1.x) ** 2 < ((r.width + r1.width) * 0.5) ** 2 &&
				(p.y - p1.y) ** 2 < ((r.height + r1.height) * 0.5) ** 2
			) {
				onCollision(world, e, other);
			}
		});
	});
}

function checkGoal(world: World) {
	const p = world.getComponent(ball, Position);
	const r = world.getComponent(ball, Rect);
	if (p.x - r.width > config.playArea.width) {
		scores.left++;
		onGoal();
	}
	if (p.x + r.width < 0) {
		scores.right++;
		onGoal();
	}
}

// entity
function addPlayerPaddle(
	x: number,
	y: number,
	isLeft: boolean,
): entityT {
	const e = addRect(x, y, config.paddle.width, config.paddle.height);
	const pc = World.addComponent(e, PlayerControl);
	pc.isLeft = isLeft;
	return w.addEntity(e);
}

function addRect(
	x: number,
	y: number,
	width: number,
	height: number,
	color: string = "white",
) {
	const e = World.createEntity();
	const p = World.addComponent(e, Position);
	const v = World.addComponent(e, Velocity);
	const r = World.addComponent(e, Rect);
	p.x = x;
	p.y = y;
	r.width = width;
	r.height = height;
	r.color = color;
	return w.addEntity(e);
}

function addText(
	txt: string,
	x: number = 0,
	y: number = 0,
	txtColor: string = "black",
	fontSize: number = 20,
	backgroundColor: string = "rgba(0,0,0,0)",
): entityT {
	const e = World.createEntity();
	const t = World.addComponent(e, Text);
	const p = World.addComponent(e, Position);
	t.content = txt;
	t.color = txtColor;
	t.fontSize = fontSize;
	t.backgroundColor = backgroundColor;
	p.x = x;
	p.y = y;
	return w.addEntity(e);
}

if (canvas) {
	canvas.width = config.playArea.width;
	canvas.height = config.playArea.height;
	//canvas.style.imageRendering = "pixelated";
}

const keys: Record<KeyboardEvent["key"], boolean> = {};
globalThis.onkeydown = (e) => {
	keys[e.key] = true;
};
globalThis.onkeyup = (e) => {
	delete keys[e.key];
};

//bottom wall
addRect(
	config.playArea.width * 0.5,
	config.playArea.height * 0,
	config.playArea.width,
	10,
);
//top wall
addRect(
	config.playArea.width * 0.5,
	config.playArea.height * 1,
	config.playArea.width,
	10,
);

const ball = addRect(
	config.playArea.width * 0.5,
	config.playArea.height * 0.5,
	config.ball.width,
	config.ball.height,
);

const playerLeft = addPlayerPaddle(
	config.playArea.width * config.paddle.padding,
	config.playArea.height * 0.5,
	true,
);
const playerRight = addPlayerPaddle(
	config.playArea.width * (1 - config.paddle.padding),
	config.playArea.height * 0.5,
	false,
);

function reset() {
	const ballV = w.getComponent(ball, Velocity);
	const ballP = w.getComponent(ball, Position);
	ballP.x = config.playArea.width * 0.5;
	ballP.y = config.playArea.height * 0.5;
	ballV.x = config.ball.speed;
	ballV.y = 0;
	let rad = Math.random() * 40 / 180 * Math.PI;
	rad *= Math.random() > 0.5 ? 1 : -1;
	rad += Math.random() > 0.5 ? Math.PI : 0;
	rotate(ballV, rad);
	const pLP = w.getComponent(playerLeft, Position);
	const pRP = w.getComponent(playerRight, Position);
	pLP.y = config.playArea.height * 0.5;
	pRP.y = config.playArea.height * 0.5;
}

function rotate(vec2: { x: number; y: number }, rad: number) {
	const s = Math.sin(rad);
	const c = Math.cos(rad);
	const x = vec2.x;
	const y = vec2.y;
	vec2.x = c * x - s * y;
	vec2.y = s * x + c * y;
}

function onGoal() {
	const t = w.getComponent(goalTexts, Text);
	t.content = `${scores.left} : ${scores.right}`;
	reset();
}

function onCollision(world: World, e: entityT, other: entityT) {
	const p = world.getComponent(e, Position);
	const p1 = world.getComponent(other, Position);
	const r = world.getComponent(e, Rect);
	const r1 = world.getComponent(other, Rect);
	const v = world.getComponent(e, Velocity);
	const v1 = world.getComponent(other, Velocity);

	const vMag = (v.x ** 2 + v.y ** 2) ** 0.5;
	const vNx = v.x / vMag, vNy = v.y / vMag;
	//p.x+vNx*t=someX,t=(someX-p.x)/vNx
	let t = 0;
	if (vNx != 0) {
		t = (p1.x - (r1.width + r.width) * 0.5 - p.x) / vNx;
		if (
			p.x < p1.x && t < 0 &&
			p.y + t * vNy < p1.y + (r1.height + r.height) * 0.5 &&
			p.y + t * vNy > p1.y - (r1.height + r.height) * 0.5
		) {
			p.x += t * vNx;
			p.y += t * vNy;
			v.x > 0 && (v.x *= -1);
			v.y += v1.y;
		}
		t = (p1.x + (r1.width + r.width) * 0.5 - p.x) / vNx;
		if (
			p.x > p1.x && t < 0 &&
			p.y + t * vNy < p1.y + (r1.height + r.height) * 0.5 &&
			p.y + t * vNy > p1.y - (r1.height + r.height) * 0.5
		) {
			p.x += t * vNx;
			p.y += t * vNy;
			v.x < 0 && (v.x *= -1);
			v.y += v1.y;
		}
	}
	if (vNy != 0) {
		t = (p1.y - (r1.height + r.height) * 0.5 - p.y) / vNy;
		if (
			p.y < p1.y && t < 0 &&
			p.x + t * vNx < p1.x + (r1.width + r.width) * 0.5 &&
			p.x + t * vNx > p1.x - (r1.width + r.width) * 0.5
		) {
			p.x += t * vNx;
			p.y += t * vNy;
			v.y > 0 && (v.y *= -1);
		}
		t = (p1.y + (r1.height + r.height) * 0.5 - p.y) / vNy;
		if (
			p.y > p1.y && t < 0 &&
			p.x + t * vNx < p1.x + (r1.width + r.width) * 0.5 &&
			p.x + t * vNx > p1.x - (r1.width + r.width) * 0.5
		) {
			p.x += t * vNx;
			p.y += t * vNy;
			v.y < 0 && (v.y *= -1);
		}
	}
}

const scores = { left: 0, right: 0 };

const goalTexts = addText(`${scores.left} : ${scores.right}`);
const t = w.getComponent(goalTexts, Text);
t.color = "white";
t.fontSize = 40;

reset();

(function update() {
	w.update(
		drawBackgound,
		drawRects,
		drawTexts,
		move,
		handlePlayerControl,
		checkCollision,
		checkGoal,
	);
	requestAnimationFrame(update);
})();
