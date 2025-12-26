import type { INode } from "svgson"
import type { CutSetting } from "../../classes/elements/CutSetting"
import { ShapeEllipse } from "../../classes/elements/shapes/ShapeEllipse"
import {
  addPts,
  apply,
  arrayToMatrix,
  type BBox,
  emptyBox,
  identity,
  matToSvg,
} from "../_math"
import { generateScanLines } from "../fill-patterns"
import { g, leaf } from "../node-helpers"
import { colorForCutIndex } from "../palette"
import type { RenderOptions, ShapeRenderer } from "./index"

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

  toSvg: (el, cutSettings, options): INode => {
    const xform = el.xform ? arrayToMatrix(el.xform) : identity()
    const transform = matToSvg(xform)
    const rx = el.rx || 0
    const ry = el.ry || 0
    const stroke = colorForCutIndex(el.cutIndex)

    const children: INode[] = []

    // Get cut settings for this shape to determine if we should show fill
    const cutSetting =
      el.cutIndex !== undefined ? cutSettings.get(el.cutIndex) : undefined
    // Only show fill for "Scan" or "Scan+Cut" modes
    const shouldShowFill =
      cutSetting &&
      (cutSetting.type === "Scan" || cutSetting.type === "Scan+Cut")

    if (shouldShowFill && cutSetting) {
      // Generate fill pattern in local coordinates (bounding box of ellipse)
      const localBBox: BBox = {
        minX: -rx,
        minY: -ry,
        maxX: rx,
        maxY: ry,
      }

      const fillSettings = {
        interval: cutSetting.interval || 0.1,
        angle: cutSetting.angle || 0,
        crossHatch: cutSetting.crossHatch || false,
      }

      const fillLines = generateScanLines(localBBox, fillSettings, stroke, options.strokeWidth)
      children.push(...fillLines)
    }

    // Always add the outline
    const child =
      rx === ry
        ? leaf("circle", {
            cx: "0",
            cy: "0",
            r: String(rx),
            fill: "none",
            stroke,
          })
        : leaf("ellipse", {
            cx: "0",
            cy: "0",
            rx: String(rx),
            ry: String(ry),
            fill: "none",
            stroke,
          })
    children.push(child)

    return g({ transform }, children)
  },
}
