/**
 * Helper functions to convert shapes to SVG path data strings.
 * Used for combining multiple shapes into a single compound path with fill-rule.
 */
import type { ShapeEllipse } from "../classes/elements/shapes/ShapeEllipse"
import type { ShapePath } from "../classes/elements/shapes/ShapePath"
import type { ShapeRect } from "../classes/elements/shapes/ShapeRect"
import { apply, arrayToMatrix, identity, type Mat, type Pt } from "./_math"

/**
 * Apply a transformation matrix to a point and return formatted coordinates
 */
function transformPoint(pt: Pt, matrix: Mat): Pt {
  return apply(matrix, pt)
}

/**
 * Generate SVG path data for a ShapePath
 */
export function shapePathToPathData(path: ShapePath): string {
  const matrix = path.xform ? arrayToMatrix(path.xform) : identity()
  let d = ""

  for (let i = 0; i < path.prims.length; i++) {
    const prim = path.prims[i]!
    const startV = path.verts[i]!
    const endV = path.verts[(i + 1) % path.verts.length]!

    // Transform the points
    const startPt = transformPoint({ x: startV.x, y: startV.y }, matrix)

    if (i === 0) {
      d += `M ${startPt.x} ${startPt.y}`
    }

    if (prim.type === 0) {
      // LineTo
      const endPt = transformPoint({ x: endV.x, y: endV.y }, matrix)
      d += ` L ${endPt.x} ${endPt.y}`
    } else if (prim.type === 1) {
      // BezierTo
      const c0x = startV.c0x ?? startV.x
      const c0y = startV.c0y ?? startV.y
      const c1x = endV.c1x ?? endV.x
      const c1y = endV.c1y ?? endV.y

      const cp0 = transformPoint({ x: c0x, y: c0y }, matrix)
      const cp1 = transformPoint({ x: c1x, y: c1y }, matrix)
      const endPt = transformPoint({ x: endV.x, y: endV.y }, matrix)

      d += ` C ${cp0.x} ${cp0.y} ${cp1.x} ${cp1.y} ${endPt.x} ${endPt.y}`
    }
  }

  if (d.length > 0 && path.isClosed) {
    d += " Z"
  }

  return d
}

/**
 * Generate SVG path data for a ShapeRect (including corner radius support)
 */
export function rectToPathData(rect: ShapeRect): string {
  const matrix = rect.xform ? arrayToMatrix(rect.xform) : identity()
  const w = rect.w || 0
  const h = rect.h || 0
  const cr = rect.cr || 0

  // For rectangles with corner radius, we need to use arcs
  if (cr > 0) {
    // Ensure corner radius doesn't exceed half the width or height
    const r = Math.min(cr, w / 2, h / 2)

    // Define the corners (starting from top-left, going clockwise)
    // The path goes: top edge, top-right corner arc, right edge, bottom-right corner arc,
    // bottom edge, bottom-left corner arc, left edge, top-left corner arc
    const p0 = transformPoint({ x: r, y: 0 }, matrix) // start of top edge
    const p1 = transformPoint({ x: w - r, y: 0 }, matrix) // end of top edge
    const p2 = transformPoint({ x: w, y: r }, matrix) // after top-right arc
    const p3 = transformPoint({ x: w, y: h - r }, matrix) // end of right edge
    const p4 = transformPoint({ x: w - r, y: h }, matrix) // after bottom-right arc
    const p5 = transformPoint({ x: r, y: h }, matrix) // end of bottom edge
    const p6 = transformPoint({ x: 0, y: h - r }, matrix) // after bottom-left arc
    const p7 = transformPoint({ x: 0, y: r }, matrix) // end of left edge

    // For transformed arcs, we need to use Bezier approximation
    // Bezier control point distance for 90-degree arc: r * 0.5522847498
    const k = 0.5522847498

    const cp_tr1 = transformPoint({ x: w - r + r * k, y: 0 }, matrix)
    const cp_tr2 = transformPoint({ x: w, y: r - r * k }, matrix)

    const cp_br1 = transformPoint({ x: w, y: h - r + r * k }, matrix)
    const cp_br2 = transformPoint({ x: w - r + r * k, y: h }, matrix)

    const cp_bl1 = transformPoint({ x: r - r * k, y: h }, matrix)
    const cp_bl2 = transformPoint({ x: 0, y: h - r + r * k }, matrix)

    const cp_tl1 = transformPoint({ x: 0, y: r - r * k }, matrix)
    const cp_tl2 = transformPoint({ x: r - r * k, y: 0 }, matrix)

    return (
      `M ${p0.x} ${p0.y}` +
      ` L ${p1.x} ${p1.y}` +
      ` C ${cp_tr1.x} ${cp_tr1.y} ${cp_tr2.x} ${cp_tr2.y} ${p2.x} ${p2.y}` +
      ` L ${p3.x} ${p3.y}` +
      ` C ${cp_br1.x} ${cp_br1.y} ${cp_br2.x} ${cp_br2.y} ${p4.x} ${p4.y}` +
      ` L ${p5.x} ${p5.y}` +
      ` C ${cp_bl1.x} ${cp_bl1.y} ${cp_bl2.x} ${cp_bl2.y} ${p6.x} ${p6.y}` +
      ` L ${p7.x} ${p7.y}` +
      ` C ${cp_tl1.x} ${cp_tl1.y} ${cp_tl2.x} ${cp_tl2.y} ${p0.x} ${p0.y}` +
      " Z"
    )
  }

  // Simple rectangle without corner radius
  const p0 = transformPoint({ x: 0, y: 0 }, matrix)
  const p1 = transformPoint({ x: w, y: 0 }, matrix)
  const p2 = transformPoint({ x: w, y: h }, matrix)
  const p3 = transformPoint({ x: 0, y: h }, matrix)

  return (
    `M ${p0.x} ${p0.y}` +
    ` L ${p1.x} ${p1.y}` +
    ` L ${p2.x} ${p2.y}` +
    ` L ${p3.x} ${p3.y}` +
    " Z"
  )
}

/**
 * Generate SVG path data for a ShapeEllipse using Bezier approximation
 */
export function ellipseToPathData(ellipse: ShapeEllipse): string {
  const matrix = ellipse.xform ? arrayToMatrix(ellipse.xform) : identity()
  const rx = ellipse.rx || 0
  const ry = ellipse.ry || 0

  // Bezier control point distance for quarter ellipse: r * 0.5522847498
  const k = 0.5522847498

  // Four points on the ellipse (at 0°, 90°, 180°, 270°)
  const p0 = transformPoint({ x: rx, y: 0 }, matrix) // right
  const p1 = transformPoint({ x: 0, y: ry }, matrix) // top
  const p2 = transformPoint({ x: -rx, y: 0 }, matrix) // left
  const p3 = transformPoint({ x: 0, y: -ry }, matrix) // bottom

  // Control points for each quadrant
  const cp0_1a = transformPoint({ x: rx, y: ry * k }, matrix)
  const cp0_1b = transformPoint({ x: rx * k, y: ry }, matrix)

  const cp1_2a = transformPoint({ x: -rx * k, y: ry }, matrix)
  const cp1_2b = transformPoint({ x: -rx, y: ry * k }, matrix)

  const cp2_3a = transformPoint({ x: -rx, y: -ry * k }, matrix)
  const cp2_3b = transformPoint({ x: -rx * k, y: -ry }, matrix)

  const cp3_0a = transformPoint({ x: rx * k, y: -ry }, matrix)
  const cp3_0b = transformPoint({ x: rx, y: -ry * k }, matrix)

  return (
    `M ${p0.x} ${p0.y}` +
    ` C ${cp0_1a.x} ${cp0_1a.y} ${cp0_1b.x} ${cp0_1b.y} ${p1.x} ${p1.y}` +
    ` C ${cp1_2a.x} ${cp1_2a.y} ${cp1_2b.x} ${cp1_2b.y} ${p2.x} ${p2.y}` +
    ` C ${cp2_3a.x} ${cp2_3a.y} ${cp2_3b.x} ${cp2_3b.y} ${p3.x} ${p3.y}` +
    ` C ${cp3_0a.x} ${cp3_0a.y} ${cp3_0b.x} ${cp3_0b.y} ${p0.x} ${p0.y}` +
    " Z"
  )
}
