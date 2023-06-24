import BozoECS from "../BozoECS.js";
import { position, velocity, appearance } from "../components.js";
import { random, add, subtract, multS, distance, mag, setMag, direction } from "../helper.js";

function main() {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;

  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "white";

  document.body.appendChild(canvas);

  const entities = new Array(100);

  const base = BozoECS.createEntity();

  BozoECS.addComponents(base, [position, velocity, appearance]);

  const maxSpeed = 100;
  for (let i = 0; i < entities.length; i++) {
    const instance = BozoECS.instantiate(base);

    const [p, v] = BozoECS.getComponents(instance, [position, velocity]);

    p.x = random(0, canvas.width);
    p.y = random(0, canvas.height);

    v.x = random(-maxSpeed, maxSpeed);
    v.y = random(-maxSpeed, maxSpeed);

    entities[i] = instance;
  }

  const render = BozoECS.createSystem(world => {
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    BozoECS.forEach(world, [position, appearance], (p, a) => {
      ctx.moveTo(p.x + a.radius, p.y);
      ctx.arc(p.x, p.y, a.radius, 0, 2 * Math.PI);
    })
    ctx.stroke();
  })

  const move = BozoECS.createSystem((world, dt) => {
    BozoECS.forEach(world, [position, velocity], (p, v) => {
      p.x += v.x * dt;
      p.y += v.y * dt;
    })
  })

  const wallBounce = BozoECS.createSystem((world, dt) => {
    BozoECS.forEach(world, [position, velocity], (p, v) => {
      let futureX = p.x + v.x * dt;
      let futureY = p.y + v.y * dt;

      if (futureX < 0 || futureX > canvas.width) {
        p.x = futureX < 0 ? 0 : canvas.width;
        v.x *= -1;
      }

      if (futureY < 0 || futureY > canvas.height) {
        p.y = futureY < 0 ? 0 : canvas.height;
        v.y *= -1;
      }
    })
  })

  const collision = BozoECS.createSystem(world => {
    BozoECS.forEach(world, [position, velocity, appearance], (p, v, a) => {
      BozoECS.forEach(world, [position, velocity, appearance], (p1, v1, a1) => {
        if (p == p1) return;

        let dis = distance(p, p1);
        let min = a.radius + a1.radius;

        if (dis >= min) return;

        let diff = min - dis;
        let dir = direction(p, p1);

        diff = setMag(dir, diff);

        subtract(p, diff);

        add(v, v1);
        add(v1, v);

        if (mag(v) > maxSpeed) setMag(v, maxSpeed);
        if (mag(v1) > maxSpeed) setMag(v1, maxSpeed);
      })
    })
  })

  const systems = [render, wallBounce, collision, move];

  const w = BozoECS.createWorld(entities, systems);

  var past = performance.now();

  update(w, past);
}

function update(world, past) {
  let dt = performance.now() - past;
  BozoECS.update(world, dt / 1000);
  past += dt;
  requestAnimationFrame(() => update(world, past));
}

main();