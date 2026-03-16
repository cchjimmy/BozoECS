export type QtreeRect = { width: number; height: number; x: number; y: number };
export type QtreeLine = { x1: number; y1: number; x2: number; y2: number };
export type QtreeCircle = { x: number; y: number; radius: number };
export type QtreeShapes = QtreeRect | QtreeCircle | QtreeLine;

export function rectContainShape(a: QtreeRect, b: QtreeShapes): boolean {
  if (isRect(b)) {
    return rectContainRect(a, b);
  } else if (isLine(b)) {
    return rectContainLine(a, b);
  } else if (isCircle(b)) {
    return rectContainCircle(a, b);
  }
  return false;
}
export function rectIntersectShape(a: QtreeRect, b: QtreeShapes): boolean {
  if (isRect(b)) {
    return rectIntersectRect(a, b);
  } else if (isCircle(b)) {
    return rectIntersectCircle(a, b);
  } else if (isLine(b)) {
    return rectIntersectLine(a, b);
  }
  return false;
}
export function rectContainRect(a: QtreeRect, b: QtreeRect): boolean {
  return (
    a.width * a.height > b.width * b.height &&
    (a.x + a.width / 2 - (b.x + b.width / 2)) ** 2 <
      ((a.width - b.width) / 2) ** 2 &&
    (a.y + a.height / 2 - (b.y + b.height / 2)) ** 2 <
      ((a.height - b.height) / 2) ** 2
  );
}
export function rectIntersectRect(a: QtreeRect, b: QtreeRect): boolean {
  return (
    (a.x + a.width / 2 - (b.x + b.width / 2)) ** 2 <
      ((a.width + b.width) / 2) ** 2 &&
    (a.y + a.height / 2 - (b.y + b.height / 2)) ** 2 <
      ((a.height + b.height) / 2) ** 2
  );
}
export function rectIntersectRay(a: QtreeRect, b: QtreeLine): boolean {
  // credit: https://stackoverflow.com/questions/10906381/how-to-find-out-if-a-ray-intersects-a-rectangle
  const normalX = b.y2 - b.y1;
  const normalY = b.x1 - b.x2;
  let prev = -2;
  for (let i = 0; i < 4; i++) {
    const dot =
      (a.x + a.width * (i % 2) - b.x1) * normalX +
      (a.y + a.height * Math.floor(i / 2) - b.y1) * normalY;
    if (prev != -2 && prev * dot < 0) return true;
    prev = dot;
  }
  return false;
}
export function lineIntersectRay(
  QtreeLine: QtreeLine,
  ray: QtreeLine,
): boolean {
  const d =
    (ray.x2 - ray.x1) * (QtreeLine.y2 - QtreeLine.y1) -
    (QtreeLine.x2 - QtreeLine.x1) * (ray.y2 - ray.y1);
  if (d == 0) return false;
  const t =
    (1 / d) *
    -(
      -(QtreeLine.x1 - ray.x1) * (ray.y2 - ray.y1) +
      (QtreeLine.y1 - ray.y1) * (ray.x2 - ray.x1)
    );
  return t >= 0 && t <= 1;
}
export function circleIntersectRay(a: QtreeCircle, b: QtreeLine): boolean {
  // (x - cx) ^ 2 + (y - cy) ^ 2 = r ^ 2
  // y = m * x + c
  // (x - cx) ^ 2 + (m * x + c - cy) ^ 2 = r ^ 2
  // x ^ 2 - 2 * cx * x + cx ^ 2 + (m * x) ^ 2 + m * x * c - m * x * cy + c * m * x + c ^ 2 - c * cy - cy * m * x - cy * c + cy ^ 2 = r ^ 2
  // x ^ 2 * (1 + m ^ 2) + x * (-2 * cx + m * c - m * cy + c * m - cy * m) + (cx ^ 2 + c ^ 2 - c * cy - cy * c + cy ^ 2) = r ^ 2
  const m = (b.y2 - b.y1) / (b.x2 - b.x1);
  const c = b.y1 / (m * b.x1);
  const A = 1 + m * m;
  const B = 2 * (-a.x + m * (c - a.y));
  const C = a.x * a.x + c * c - 2 * c * a.y + a.y * a.y;
  // quadratic formula determinant B ^ 2 - 4 * A * C
  // if det < 0 then no real solution, otherwise there are solutions
  const det = B * B - 4 * A * C;
  if (det < 0) return false;
  // intersection points
  const x1 = (-B + Math.sqrt(det)) / (2 * A);
  const x2 = (-B - Math.sqrt(det)) / (2 * A);
  const y1 = m * x1 + c;
  const y2 = m * x2 + c;
  // checks if vectors of ray and ray origin to interesections align
  return (
    (b.x2 - b.x1) * (x1 - b.x1) + (b.y2 - b.y1) * (y1 - b.y1) > 0 &&
    (b.x2 - b.x1) * (x2 - b.x1) + (b.y2 - b.y1) * (y2 - b.y1) > 0
  );
}
export function RayIntersectShape(a: QtreeLine, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleIntersectRay(b, a);
  } else if (isRect(b)) {
    return rectIntersectRay(b, a);
  } else if (isLine(b)) {
    return lineIntersectRay(a, b);
  }
  return false;
}
export function rectContainCircle(a: QtreeRect, b: QtreeCircle): boolean {
  return (
    (a.x + a.width / 2 - b.x) ** 2 < (a.width / 2 - b.radius) ** 2 &&
    (a.y + a.height / 2 - b.y) ** 2 < (a.height / 2 - b.radius) ** 2
  );
}
export function rectIntersectCircle(a: QtreeRect, b: QtreeCircle): boolean {
  return !(
    (a.x + a.width / 2 - b.x) ** 2 < (a.width / 2) ** 2 ||
    (a.y + a.height / 2 - b.y) ** 2 < (a.height / 2) ** 2
  ) // checks circle position at corners of rect
    ? (Math.abs(a.x + a.width / 2 - b.x) - a.width / 2) ** 2 +
        (Math.abs(a.y + a.height / 2 - b.y) - a.height / 2) ** 2 <
        b.radius ** 2
    : (a.x + a.width / 2 - b.x) ** 2 < ((a.width + b.radius * 2) / 2) ** 2 &&
        (a.y + a.height / 2 - b.y) ** 2 < ((a.height + b.radius * 2) / 2) ** 2;
}
export function rectContainLine(a: QtreeRect, b: QtreeLine): boolean {
  return (
    (a.x + a.width / 2 - b.x1) ** 2 < (a.width / 2) ** 2 &&
    (a.x + a.width / 2 - b.x2) ** 2 < (a.width / 2) ** 2 &&
    (a.y + a.height / 2 - b.y1) ** 2 < (a.height / 2) ** 2 &&
    (a.y + a.height / 2 - b.y2) ** 2 < (a.height / 2) ** 2
  );
}
export function lineIntersectLine(a: QtreeLine, b: QtreeLine): boolean {
  // credit: https://stackoverflow.com/questions/4977491/determining-if-two-QtreeLine-segments-intersect/4977569#4977569
  const d = (b.x2 - b.x1) * (a.y2 - a.y1) - (a.x2 - a.x1) * (b.y2 - b.y1);
  if (d == 0) return false;
  const s =
    (1 / d) * ((a.x1 - b.x1) * (a.y2 - a.y1) - (a.y1 - b.y1) * (a.x2 - a.x1));
  const t =
    (1 / d) * -(-(a.x1 - b.x1) * (b.y2 - b.y1) + (a.y1 - b.y1) * (b.x2 - b.x1));
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}
export function rectContainPoint(
  rect: QtreeRect,
  x: number,
  y: number,
): boolean {
  return (
    (rect.x + rect.width / 2 - x) ** 2 <= (rect.width / 2) ** 2 &&
    (rect.y + rect.height / 2 - y) ** 2 <= (rect.height / 2) ** 2
  );
}
export function rectIntersectLine(a: QtreeRect, b: QtreeLine): boolean {
  // checks if either points of the QtreeLine lies within QtreeRect
  if (rectContainPoint(a, b.x1, b.y1) || rectContainPoint(a, b.x2, b.y2))
    return true;
  const side: QtreeLine = { x1: 0, y1: 0, x2: 0, y2: 0 };
  for (let i = 0; i < 4; i++) {
    side.x1 = a.x + a.width * +(i == 1 || i == 2);
    side.y1 = a.y + a.height * Math.floor(i / 2);
    side.x2 = a.x + a.width * +(i < 2);
    side.y2 = a.y + a.height * +(i == 1 || i == 2);
    if (!lineIntersectLine(side, b)) continue;
    return true;
  }
  return false;
}
export function circleIntersectLine(a: QtreeCircle, b: QtreeLine): boolean {
  const m = (b.y2 - b.y1) / (b.x2 - b.x1);
  const c = b.y1 / (m * b.x1);
  const A = 1 + m * m;
  const B = 2 * (-a.x + m * (c - a.y));
  const C = a.x * a.x + c * c - 2 * c * a.y + a.y * a.y;
  const det = B * B - 4 * A * C;
  if (det < 0) return false;
  const x1 = (-B + Math.sqrt(det)) / (2 * A);
  const x2 = (-B - Math.sqrt(det)) / (2 * A);
  const maxLineX = b.x1 > b.x2 ? b.x1 : b.x2;
  const minLineX = maxLineX == b.x1 ? b.x2 : b.x1;
  return (
    // checks either points of QtreeLine is within QtreeCircle
    (a.x - b.x1) * (a.x - b.x1) + (a.y - b.y1) * (a.y - b.y1) <
      a.radius * a.radius ||
    (a.x - b.x2) * (a.x - b.x2) + (a.y - b.y2) * (a.y - b.y2) <
      a.radius * a.radius ||
    // checks if intersection lies within QtreeLine
    (x1 < maxLineX && x1 > minLineX) ||
    (x2 < maxLineX && x2 > minLineX)
  );
}
export function circleIntersectCircle(a: QtreeCircle, b: QtreeCircle): boolean {
  return (
    (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) <
    (a.radius + b.radius) * (a.radius + b.radius)
  );
}
export function circleIntersectShape(a: QtreeCircle, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleIntersectCircle(a, b);
  } else if (isLine(b)) {
    return circleIntersectLine(a, b);
  } else if (isRect(b)) {
    return rectIntersectCircle(b, a);
  }
  return false;
}
export function lineIntersectShape(a: QtreeLine, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleIntersectLine(b, a);
  } else if (isLine(b)) {
    return lineIntersectLine(a, b);
  } else if (isRect(b)) {
    return rectIntersectLine(b, a);
  }
  return false;
}
export function shapeIntersectShape(a: QtreeShapes, b: QtreeShapes): boolean {
  if (isCircle(a)) {
    return circleIntersectShape(a, b);
  } else if (isRect(a)) {
    return rectIntersectShape(a, b);
  } else if (isLine(a)) {
    return lineIntersectShape(a, b);
  }
  return false;
}

export function isCircle(shape: object): shape is QtreeCircle {
  return Object.hasOwn(shape, "radius");
}

export function isRect(shape: object): shape is QtreeRect {
  return Object.hasOwn(shape, "width");
}
export function isLine(shape: object): shape is QtreeLine {
  return Object.hasOwn(shape, "x1");
}
