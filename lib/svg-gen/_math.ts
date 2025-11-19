import type { Matrix } from "transformation-matrix"
import {
  applyToPoint,
  compose,
  identity as matrixIdentity,
  toSVG,
} from "transformation-matrix"

export type Mat = Matrix
export type Pt = { x: number; y: number }

// Convert array format [a, b, c, d, e, f] to Matrix object
export function arrayToMatrix(
  arr: [number, number, number, number, number, number],
): Matrix {
  const [a, b, c, d, e, f] = arr
  return { a, b, c, d, e, f }
}

// Convert Matrix object to array format [a, b, c, d, e, f]
export function matrixToArray(
  m: Matrix,
): [number, number, number, number, number, number] {
  return [m.a, m.b, m.c, m.d, m.e, m.f]
}

export function apply(m: Mat, p: Pt): Pt {
  return applyToPoint(m, p)
}

export function mul(m1: Mat, m2: Mat): Mat {
  return compose(m1, m2)
}

export function matToSvg(m: Mat): string {
  return toSVG(m)
}

export function identity(): Mat {
  return matrixIdentity()
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
