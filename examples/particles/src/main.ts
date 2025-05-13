import { Component, World } from "../../../src/index.ts";

function random(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

const ENTITY_COUNT = 1000;

function fullsrn() {
	canvas.width = innerWidth;
	canvas.height = innerHeight;
}

fullsrn();

globalThis.window.onresize = fullsrn;
document.body.style.margin = "0px";
document.body.style.userSelect = "none";
document.body.style.overflow = "hidden";
document.body.style.touchAction = "none";

const w = new World();

// components
class Position extends Component {
	x: number = 0;
	y: number = 0;
}
class Velocity extends Component {
	x: number = 0;
	y: number = 0;
}
class Circle extends Component {
	radius: number = 10;
	color: string = "green";
}

World
	.registerComponent(Position)
	.registerComponent(Velocity)
	.registerComponent(Circle);

// systems
function logFPS(_world: World, dt: number) {
	if (!ctx) return;
	const txt = `FPS: ${(1 / dt).toFixed(0)}`;
	const fontSize = 30;
	const padding = 10;
	const margin = 5;
	const old = ctx.fillStyle;

	ctx.font = `${fontSize}px serif`;
	const txtMetric = ctx.measureText(txt);
	ctx.fillStyle = "white";
	ctx.fillRect(
		padding,
		padding,
		2 * margin + txtMetric.width,
		2 * margin + txtMetric.emHeightAscent,
	);
	ctx.fillStyle = "black";
	ctx.fillText(
		txt,
		margin + padding,
		margin + padding + txtMetric.emHeightAscent,
	);
	ctx.fillStyle = old;
}
function render(world: World, _dt: number) {
	if (!ctx) return;
	const twoPI = 2 * Math.PI;
	//ctx.lineWidth = 3;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	const oldStyle = ctx.strokeStyle;
	world.query({ and: [Position, Circle] }).forEach((e) => {
		const p = world.getComponent(e, Position);
		const c = world.getComponent(e, Circle);
		ctx.strokeStyle = c.color;
		ctx.beginPath();
		ctx.arc(p.x, p.y, c.radius, 0, twoPI);
		ctx.stroke();
	});
	ctx.strokeStyle = oldStyle;
}
function move(world: World, dt: number) {
	world.query({ and: [Position, Velocity] }).forEach((e) => {
		const p = world.getComponent(e, Position);
		const v = world.getComponent(e, Velocity);
		p.x += v.x * dt;
		p.y += v.y * dt;
	});
}
function bounce(world: World, _dt: number) {
	world.query({ and: [Position, Velocity, Circle] }).forEach((e) => {
		const p = world.getComponent(e, Position);
		const v = world.getComponent(e, Velocity);
		const c = world.getComponent(e, Circle);
		if (p.x - c.radius < 0 || p.x + c.radius > canvas.width) {
			v.x *= -1;
			p.x = p.x < canvas.width * 0.5 ? c.radius : canvas.width - c.radius;
		}
		if (p.y - c.radius < 0 || p.y + c.radius > canvas.height) {
			v.y *= -1;
			p.y = p.y < canvas.height * 0.5
				? c.radius
				: canvas.height - c.radius;
		}
	});
}

// entity
function createEntity() {
	const e = w.addEntity();
	const p = World.addComponent(e, Position);
	const v = World.addComponent(e, Velocity);
	const c = World.addComponent(e, Circle);
	const maxSpeed = 100;
	p.x = random(0, canvas.width);
	p.y = random(0, canvas.height);
	v.x = random(-maxSpeed, maxSpeed);
	v.y = random(-maxSpeed, maxSpeed);
	c.radius = random(10, 30);
	c.color = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
	return e;
}

for (let i = 0; i < ENTITY_COUNT; ++i) {
	createEntity();
}

(function update() {
	w.update(render, move, bounce, logFPS);
	requestAnimationFrame(update);
})();
