import type { INode } from "svgson"
import { ShapeRect } from "../../classes/elements/shapes/ShapeRect"
import {
  addPts,
  apply,
  arrayToMatrix,
  type BBox,
  emptyBox,
  identity,
  matToSvg,
} from "../_math"
import { g, leaf } from "../node-helpers"
import { colorForCutIndex } from "../palette"
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

  toSvg: (rect, options): INode => {
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
