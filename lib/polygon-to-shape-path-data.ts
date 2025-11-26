import type { Polygon } from "@flatten-js/core"

export interface ShapePathData {
  verts: Array<{ x: number; y: number }>
  prims: Array<{ type: number }>
  isClosed: boolean
}

/**
 * Converts a flatten-js Polygon to verts and prims arrays for use with ShapePath
 * The resulting data keeps all polygons in a single path by inserting move (type 2)
 * primitives between subpaths so the cutter can "hop" without drawing.
 */
export function polygonToShapePathData(polygon: Polygon): ShapePathData {
  const verts: Array<{ x: number; y: number }> = []
  const prims: Array<{ type: number }> = []

  // Get SVG representation and extract path data
  const svgString = polygon.svg()
  const dAttributeMatch = svgString.match(/\bd="([^"]+)"/)

  if (!dAttributeMatch || !dAttributeMatch[1]) {
    return { verts, prims, isClosed: true }
  }

  const pathData = dAttributeMatch[1].trim()

  // Parse SVG path commands (M, L, z)
  const commands = pathData.match(/[MLzZ][^MLzZ]*/g) || []

  let currentSubpathStart = -1
  let lastVertexIndex = -1

  for (const command of commands) {
    const type = command[0]
    const coords = command.slice(1).trim()

    if (type === "M" || type === "L") {
      // Parse coordinates, allowing either comma or space separation
      const parts = coords.split(/[ ,]+/)
      const x = Number(parts[0])
      const y = Number(parts[1])

      if (!Number.isNaN(x) && !Number.isNaN(y)) {
        verts.push({ x, y })

        if (lastVertexIndex >= 0) {
          prims.push({ type: type === "M" ? 2 : 0 })
        }

        if (type === "M") {
          currentSubpathStart = verts.length - 1
        }

        lastVertexIndex = verts.length - 1
      }
    } else if (type === "z" || type === "Z") {
      // Closing the path brings us back to the start of the current subpath
      // so any following Move command should hop from that start.
      if (currentSubpathStart >= 0) {
        lastVertexIndex = currentSubpathStart
      }
    }
  }

  return { verts, prims, isClosed: true }
}
