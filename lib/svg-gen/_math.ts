export type Mat = [a: number, b: number, c: number, d: number, tx: number, ty: number]
export type Pt = { x: number; y: number }

export function apply(m: Mat, p: Pt): Pt {
  const [a, b, c, d, tx, ty] = m
  return {
    x: a * p.x + c * p.y + tx,
    y: b * p.x + d * p.y + ty,
  }
}

export function mul(m1: Mat, m2: Mat): Mat {
  const [a1, b1, c1, d1, tx1, ty1] = m1
  const [a2, b2, c2, d2, tx2, ty2] = m2
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * tx2 + c1 * ty2 + tx1,
    b1 * tx2 + d1 * ty2 + ty1,
  ]
}

export function matToSvg(m: Mat): string {
  return `matrix(${m.join(" ")})`
}

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function emptyBox(): BBox {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  }
}

export function boxUnion(a: BBox, b: BBox): BBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

export function addPts(bb: BBox, pts: Pt[]): BBox {
  for (const p of pts) {
    bb.minX = Math.min(bb.minX, p.x)
    bb.minY = Math.min(bb.minY, p.y)
    bb.maxX = Math.max(bb.maxX, p.x)
    bb.maxY = Math.max(bb.maxY, p.y)
  }
  return bb
}
