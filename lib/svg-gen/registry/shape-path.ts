import type { INode } from "svgson"
import type { CutSetting } from "../../classes/elements/CutSetting"
import { ShapePath } from "../../classes/elements/shapes/ShapePath"
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
import type { ShapeRenderer } from "./index"

export const pathRenderer: ShapeRenderer<ShapePath> = {
  match: (s): s is ShapePath => s instanceof ShapePath,

  bbox: (p): BBox => {
    const xform = p.xform ? arrayToMatrix(p.xform) : identity()
    const pts = p.verts.map((v) => apply(xform, { x: v.x, y: v.y }))
    return addPts(emptyBox(), pts)
  },

  toSvg: (p, cutSettings): INode => {
    const xform = p.xform ? arrayToMatrix(p.xform) : identity()
    const transform = matToSvg(xform)
    const stroke = colorForCutIndex(p.cutIndex)

    const children: INode[] = []

    // Build the path data string first (we'll need it for both outline and clipping)
    let d = ""
    for (let i = 0; i < p.prims.length; i++) {
      const prim = p.prims[i]!
      const startV = p.verts[i]!
      const endV = p.verts[(i + 1) % p.verts.length]!

      if (i === 0) {
        // First vertex - move to start
        d += `M ${startV.x} ${startV.y}`
      }

      if (prim.type === 0) {
        // LineTo - straight line to next vertex
        d += ` L ${endV.x} ${endV.y}`
      } else if (prim.type === 1) {
        // BezierTo - curved line to next vertex using control points
        // Control points: c0 from start vertex (outgoing), c1 from end vertex (incoming)
        const c0x = startV.c0x ?? startV.x
        const c0y = startV.c0y ?? startV.y
        const c1x = endV.c1x ?? endV.x
        const c1y = endV.c1y ?? endV.y

        // Use cubic bezier for two control points
        d += ` C ${c0x} ${c0y} ${c1x} ${c1y} ${endV.x} ${endV.y}`
      }
    }

    // Close the path only if it's a closed path
    if (d.length > 0 && p.isClosed) {
      d += " Z"
    }

    // Get cut settings for this shape to determine if we should show fill
    const cutSetting =
      p.cutIndex !== undefined ? cutSettings.get(p.cutIndex) : undefined
    // Only show fill for closed paths in "Scan" or "Scan+Cut" modes
    const shouldShowFill =
      p.isClosed &&
      cutSetting &&
      (cutSetting.type === "Scan" || cutSetting.type === "Scan+Cut")

    if (shouldShowFill && cutSetting) {
      // Calculate bounding box of the path
      const bbox = addPts(
        emptyBox(),
        p.verts.map((v) => ({ x: v.x, y: v.y })),
      )

      const fillSettings = {
        interval: cutSetting.interval || 0.1,
        angle: cutSetting.angle || 0,
        crossHatch: cutSetting.crossHatch || false,
      }

      const fillLines = generateScanLines(bbox, fillSettings, stroke)

      // Use the path as a clip-path to ensure scan lines only appear inside the shape
      // Generate a unique ID for this clip path
      const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create clipPath definition
      const clipPath = {
        name: "clipPath",
        type: "element",
        value: "",
        attributes: { id: clipId },
        children: [leaf("path", { d })],
      }

      // Wrap scan lines in a group with clip-path
      const clippedGroup = {
        name: "g",
        type: "element",
        value: "",
        attributes: { "clip-path": `url(#${clipId})` },
        children: fillLines,
      }

      children.push(clipPath)
      children.push(clippedGroup)
    }

    // Always add the outline
    children.push(
      leaf("path", {
        d,
        fill: "none",
        stroke,
        "stroke-width": "0.1",
      }),
    )

    return g({ transform }, children)
  },
}
