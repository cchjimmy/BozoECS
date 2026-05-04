export type QtreeRect = { width: number; height: number; x: number; y: number };
export type QtreeLine = { x1: number; y1: number; x2: number; y2: number };
export type QtreeCircle = { x: number; y: number; radius: number };
export type QtreePoint = { x: number; y: number };
export type QtreeShapes = QtreeRect | QtreeCircle | QtreeLine | QtreePoint;

export function rectContainShape(a: QtreeRect, b: QtreeShapes): boolean {
  if (isRect(b)) {
    return rectContainRect(a, b);
  } else if (isLine(b)) {
    return rectContainLine(a, b);
  } else if (isCircle(b)) {
    return rectContainCircle(a, b);
  } else if (isPoint(b)) {
    return rectContainPoint(a, b);
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
  } else if (isPoint(b)) {
    return rectContainPoint(a, b);
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
export function pointIntersectRay(a: QtreePoint, b: QtreeLine): boolean {
  const m = (b.y2 - b.y1) / (b.x2 - b.x1);
  const c = b.y1 - m * b.x1;
  return (
    a.y == m * a.x + c &&
    (b.x2 - b.x1) * (a.x - b.x1) + (b.y2 - b.y1) * (a.y - b.y1) > 0
  );
}
export function pointIntersectPoint(a: QtreePoint, b: QtreePoint): boolean {
  return a.x == b.x && a.y == b.y;
}
export function circleIntersectRay(a: QtreeCircle, b: QtreeLine): boolean {
  const m1 = (b.y2 - b.y1) / (b.x2 - b.x1);
  const c1 = b.y1 - m1 * b.x1;
  const m2 = -1 / m1; // perpendicular to m1
  const c2 = a.y - m2 * a.x;
  const x = (c2 - c1) / (m1 - m2);
  const y = m1 * x + c1;
  const isSameDirection =
    (b.x2 - b.x1) * (x - b.x1) + (b.y2 - b.y1) * (y - b.y1) > 0;
  return isSameDirection
    ? (a.x - x) ** 2 + (a.y - y) ** 2 <= a.radius ** 2
    : false;
}
export function RayIntersectShape(a: QtreeLine, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleIntersectRay(b, a);
  } else if (isRect(b)) {
    return rectIntersectRay(b, a);
  } else if (isLine(b)) {
    return lineIntersectRay(a, b);
  } else if (isPoint(b)) {
    return pointIntersectRay(b, a);
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
export function lineIntersectPoint(a: QtreeLine, b: QtreePoint): boolean {
  const m = (a.y2 - a.y1) / (a.x2 - a.x1);
  const c = a.y1 - m * a.x1;
  // checks if point is on the line AND within line segment.
  return (
    b.y == m * b.x + c &&
    (b.x - a.x1) * (b.x - a.x2) + (b.y - a.y1) * (b.y - a.y2) < 0
  );
}
function _rectContainPoint(rect: QtreeRect, x: number, y: number): boolean {
  return (
    (rect.x + rect.width / 2 - x) ** 2 <= (rect.width / 2) ** 2 &&
    (rect.y + rect.height / 2 - y) ** 2 <= (rect.height / 2) ** 2
  );
}
export function rectContainPoint(a: QtreeRect, b: QtreePoint): boolean {
  return _rectContainPoint(a, b.x, b.y);
}
export function rectIntersectLine(a: QtreeRect, b: QtreeLine): boolean {
  // checks if either points of the QtreeLine lies within QtreeRect
  if (_rectContainPoint(a, b.x1, b.y1) || _rectContainPoint(a, b.x2, b.y2))
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
  const m1 = (b.y2 - b.y1) / (b.x2 - b.x1);
  const c1 = b.y1 - m1 * b.x1;
  const m2 = -1 / m1; // perpendicular to m1
  const c2 = a.y - m2 * a.x;
  const x = (c2 - c1) / (m1 - m2);
  const y = m1 * x + c1;
  // dot product between vectors constructed by the two points of the line to the intersection.
  // if it is < 0 point is on the line
  const isIntersectedWithinLine =
    (x - b.x1) * (x - b.x2) + (y - b.x1) * (y - b.y2) < 0;
  // locus of points
  return isIntersectedWithinLine
    ? (a.x - x) ** 2 + (a.y - y) ** 2 <= a.radius ** 2
    : (b.x1 - a.x) ** 2 + (b.y1 - a.y) ** 2 <= a.radius ** 2 ||
        (b.x2 - a.x) ** 2 + (b.y2 - a.y) ** 2 <= a.radius ** 2;
}
export function circleIntersectCircle(a: QtreeCircle, b: QtreeCircle): boolean {
  return (
    (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) <
    (a.radius + b.radius) * (a.radius + b.radius)
  );
}
export function circleContainPoint(a: QtreeCircle, b: QtreePoint): boolean {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= a.radius ** 2;
}
export function circleIntersectShape(a: QtreeCircle, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleIntersectCircle(a, b);
  } else if (isLine(b)) {
    return circleIntersectLine(a, b);
  } else if (isRect(b)) {
    return rectIntersectCircle(b, a);
  } else if (isPoint(b)) {
    return circleContainPoint(a, b);
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
  } else if (isPoint(b)) {
    return lineIntersectPoint(a, b);
  }
  return false;
}
export function pointIntersectShape(a: QtreePoint, b: QtreeShapes): boolean {
  if (isCircle(b)) {
    return circleContainPoint(b, a);
  } else if (isLine(b)) {
    return lineIntersectPoint(b, a);
  } else if (isRect(b)) {
    return rectContainPoint(b, a);
  } else if (isPoint(b)) {
    return pointIntersectPoint(a, b);
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
  } else if (isPoint(a)) {
    return pointIntersectShape(a, b);
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

export function isPoint(shape: object): shape is QtreePoint {
  return (
    Object.hasOwn(shape, "x") &&
    !Object.hasOwn(shape, "width") &&
    !Object.hasOwn(shape, "radius")
  );
}
