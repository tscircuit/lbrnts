import type { INode } from "svgson"
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

  toSvg: (p): INode => {
    const xform = p.xform ? arrayToMatrix(p.xform) : identity()
    const transform = matToSvg(xform)
    const stroke = colorForCutIndex(p.cutIndex)

    let d = ""
    let subpathOpen = false

    // Process each primitive which describes the segment FROM vertex[i] TO vertex[i+1]
    for (let i = 0; i < p.prims.length; i++) {
      const prim = p.prims[i]!
      const startV = p.verts[i]
      const endV = p.verts[i + 1] ?? (p.isClosed ? p.verts[0] : undefined)

      if (!startV || !endV) continue

      if (!subpathOpen && prim.type !== 2) {
        // First vertex of the current subpath - move to start
        d += `M ${startV.x} ${startV.y}`
        subpathOpen = true
      }

      if (prim.type === 2) {
        // Move/Hop without drawing
        if (p.isClosed && subpathOpen) {
          d += " Z"
        }
        d += ` M ${endV.x} ${endV.y}`
        subpathOpen = true
        continue
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

      const nextPrim = p.prims[i + 1]
      if (p.isClosed && (!nextPrim || nextPrim.type === 2)) {
        d += " Z"
        subpathOpen = false
      }
    }

    // Close the path only if it's a closed path and a subpath remains open
    if (d.length > 0 && p.isClosed && subpathOpen) {
      d += " Z"
    }

    return g({ transform }, [
      leaf("path", {
        d,
        fill: "none",
        stroke,
        "stroke-width": "0.1",
      }),
    ])
  },
}
