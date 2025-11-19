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
import { ShapeEllipse } from "../../classes/elements/shapes/ShapeEllipse"
import type { ShapeRenderer } from "./index"

export const ellipseRenderer: ShapeRenderer<ShapeEllipse> = {
  match: (s): s is ShapeEllipse => s instanceof ShapeEllipse,

  bbox: (el): BBox => {
    const rx = el.rx || 0
    const ry = el.ry || 0
    const xform = el.xform ? arrayToMatrix(el.xform) : identity()
    const extremes = [
      { x: rx, y: 0 },
      { x: -rx, y: 0 },
      { x: 0, y: ry },
      { x: 0, y: -ry },
    ]
    return addPts(
      emptyBox(),
      extremes.map((p) => apply(xform, p)),
    )
  },

  toSvg: (el): INode => {
    const xform = el.xform ? arrayToMatrix(el.xform) : identity()
    const transform = matToSvg(xform)
    const rx = el.rx || 0
    const ry = el.ry || 0
    const stroke = colorForCutIndex(el.cutIndex)
    const child =
      rx === ry
        ? leaf("circle", { cx: "0", cy: "0", r: String(rx), fill: "none", stroke })
        : leaf("ellipse", {
            cx: "0",
            cy: "0",
            rx: String(rx),
            ry: String(ry),
            fill: "none",
            stroke,
          })
    return g({ transform }, [child])
  },
}
