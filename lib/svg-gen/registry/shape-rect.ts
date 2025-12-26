import type { INode } from "svgson"
import type { CutSetting } from "../../classes/elements/CutSetting"
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
import { generateScanLines } from "../fill-patterns"
import { g, leaf } from "../node-helpers"
import { colorForCutIndex } from "../palette"
import type { RenderOptions, ShapeRenderer } from "./index"

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

  toSvg: (rect, cutSettings, options): INode => {
    const xform = rect.xform ? arrayToMatrix(rect.xform) : identity()
    const transform = matToSvg(xform)
    const w = rect.w || 0
    const h = rect.h || 0
    const cr = rect.cr || 0
    const stroke = colorForCutIndex(rect.cutIndex)

    const children: INode[] = []

    // Get cut settings for this shape to determine if we should show fill
    const cutSetting =
      rect.cutIndex !== undefined ? cutSettings.get(rect.cutIndex) : undefined
    // Only show fill for "Scan" or "Scan+Cut" modes
    const shouldShowFill =
      cutSetting &&
      (cutSetting.type === "Scan" || cutSetting.type === "Scan+Cut")

    if (shouldShowFill && cutSetting) {
      // Generate fill pattern in local coordinates (before transform)
      const localBBox: BBox = {
        minX: 0,
        minY: 0,
        maxX: w,
        maxY: h,
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
    children.push(
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
    )

    return g({ transform }, children)
  },
}
