import type { INode } from "svgson"
import { boxUnion, emptyBox, type BBox } from "../_math"
import type { ShapeBase } from "../../classes/elements/shapes/ShapeBase"
import { rectRenderer } from "./shape-rect"
import { ellipseRenderer } from "./shape-ellipse"
import { pathRenderer } from "./shape-path"
import { bitmapRenderer } from "./shape-bitmap"
import { textRenderer } from "./shape-text"
import { groupRenderer } from "./shape-group"

export interface ShapeRenderer<T extends ShapeBase = ShapeBase> {
  match(shape: ShapeBase): shape is T
  bbox(shape: T): BBox
  toSvg(shape: T): INode
}

const REGISTRY: ShapeRenderer[] = [
  rectRenderer,
  ellipseRenderer,
  pathRenderer,
  bitmapRenderer,
  textRenderer,
  groupRenderer,
]

function findRenderer(shape: ShapeBase): ShapeRenderer {
  const r = REGISTRY.find((r) => r.match(shape))
  if (!r) throw new Error(`No renderer for ${shape.token}`)
  return r
}

export function bboxOfShape(shape: ShapeBase): BBox {
  return findRenderer(shape).bbox(shape as any)
}

export function svgForShape(shape: ShapeBase): INode {
  return findRenderer(shape).toSvg(shape as any)
}

export function measure(shapes: ShapeBase[]): BBox {
  return shapes.reduce((acc, s) => boxUnion(acc, bboxOfShape(s)), emptyBox())
}

export function renderAll(shapes: ShapeBase[]): INode[] {
  return shapes.map(svgForShape)
}
