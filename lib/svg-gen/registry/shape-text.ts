import type { INode } from "svgson"
import { g, textNode } from "../node-helpers"
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
import { ShapeText } from "../../classes/elements/shapes/ShapeText"
import type { ShapeRenderer } from "./index"

export const textRenderer: ShapeRenderer<ShapeText> = {
  match: (s): s is ShapeText => s instanceof ShapeText,

  bbox: (t): BBox => {
    const xform = t.xform ? arrayToMatrix(t.xform) : identity()
    // Use backup path if available
    if (t.backupPath && t.backupPath.verts.length) {
      const pts = t.backupPath.verts.map((v) => apply(xform, { x: v.x, y: v.y }))
      return addPts(emptyBox(), pts)
    }
    // Fallback to a default size
    return addPts(emptyBox(), [
      apply(xform, { x: 0, y: 0 }),
      apply(xform, { x: 100, y: 50 }),
    ])
  },

  toSvg: (t): INode => {
    const xform = t.xform ? arrayToMatrix(t.xform) : identity()
    const transform = matToSvg(xform)
    const stroke = colorForCutIndex(t.cutIndex)
    const text = t.text || ""
    return g({ transform }, [
      {
        name: "text",
        type: "element",
        value: "",
        attributes: { x: "0", y: "0", fill: stroke },
        children: [textNode(text)],
      },
    ])
  },
}
