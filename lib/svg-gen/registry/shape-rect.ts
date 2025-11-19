import type { INode } from "svgson"
import { g, leaf } from "../node-helpers"
import {
  addPts,
  apply,
  arrayToMatrix,
  emptyBox,
  identity,
  matToSvg,
  type BBox,
} from "../_math"
import { colorForCutIndex } from "../palette"
import { ShapeRect } from "../../classes/elements/shapes/ShapeRect"
import type { ShapeRenderer } from "./index"

export const rectRenderer: ShapeRenderer<ShapeRect> = {
  match: (s): s is ShapeRect => s instanceof ShapeRect,

  bbox: (rect): BBox => {
    const w = rect.w || 0
    const h = rect.h || 0
    const xform = rect.xform ? arrayToMatrix(rect.xform) : identity()
    const corners = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ]
    return addPts(
      emptyBox(),
      corners.map((p) => apply(xform, p)),
    )
  },

  toSvg: (rect): INode => {
    const xform = rect.xform ? arrayToMatrix(rect.xform) : identity()
    const transform = matToSvg(xform)
    const w = rect.w || 0
    const h = rect.h || 0
    const cr = rect.cr || 0
    const stroke = colorForCutIndex(rect.cutIndex)
    return g({ transform }, [
      leaf("rect", {
        x: "0",
        y: "0",
        width: String(w),
        height: String(h),
        rx: String(cr),
        ry: String(cr),
        fill: "none",
        stroke,
      }),
    ])
  },
}
