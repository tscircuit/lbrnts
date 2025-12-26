import type { INode } from "svgson"
import type { CutSetting } from "../../classes/elements/CutSetting"
import type { ShapeBase } from "../../classes/elements/shapes/ShapeBase"
import { type BBox, boxUnion, emptyBox } from "../_math"
import { DEFAULT_OPTIONS, type GenerateSvgOptions } from "../options"
import { bitmapRenderer } from "./shape-bitmap"
import { ellipseRenderer } from "./shape-ellipse"
import { groupRenderer } from "./shape-group"
import { pathRenderer } from "./shape-path"
import { rectRenderer } from "./shape-rect"
import { textRenderer } from "./shape-text"

export interface RenderOptions {
  strokeWidth: number
}

export interface ShapeRenderer<T extends ShapeBase = ShapeBase> {
  match(shape: ShapeBase): shape is T
  bbox(shape: T): BBox
  toSvg(shape: T, cutSettings: Map<number, CutSetting>, options: RenderOptions): INode
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

export function svgForShape(
  shape: ShapeBase,
  cutSettings: Map<number, CutSetting>,
  options: RenderOptions,
): INode {
  return findRenderer(shape).toSvg(shape as any, cutSettings, options)
}

export function measure(shapes: ShapeBase[]): BBox {
  return shapes.reduce((acc, s) => boxUnion(acc, bboxOfShape(s)), emptyBox())
}

export function renderAll(
  shapes: ShapeBase[],
  cutSettings: Map<number, CutSetting>,
  svgOptions?: GenerateSvgOptions,
): INode[] {
  const renderOptions: RenderOptions = {
    strokeWidth: svgOptions?.defaultStrokeWidth ?? DEFAULT_OPTIONS.defaultStrokeWidth,
  }
  return shapes.map((s) => svgForShape(s, cutSettings, renderOptions))
}
