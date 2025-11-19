import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { ShapeBase } from "./ShapeBase"
import { num } from "../_coerce"

export interface Vert {
  x: number
  y: number
  c?: number // control point flag
}

export interface Prim {
  type: number
}

export class ShapePath extends ShapeBase {
  verts: Vert[] = []
  prims: Prim[] = []

  constructor() {
    super()
    this.token = "Shape.Path"
  }

  static override fromXmlJson(node: XmlJsonElement): ShapePath {
    const path = new ShapePath()
    const common = ShapeBase.readCommon(node)
    Object.assign(path, common)

    // Parse VertList
    const vertList = (node as any).VertList
    if (vertList) {
      // Handle encoded string format (new format)
      if (typeof vertList === "string") {
        path.verts = ShapePath.parseEncodedVertList(vertList)
      }
      // Handle structured XML format (old format)
      else if (vertList.Vert) {
        const verts = Array.isArray(vertList.Vert) ? vertList.Vert : [vertList.Vert]
        for (const v of verts) {
          if (v.$) {
            path.verts.push({
              x: num(v.$.x, 0),
              y: num(v.$.y, 0),
              c: num(v.$.c, undefined),
            })
          }
        }
      }
    }

    // Parse PrimList
    const primList = (node as any).PrimList
    if (primList) {
      // Handle structured XML format
      if (primList.Prim) {
        const prims = Array.isArray(primList.Prim) ? primList.Prim : [primList.Prim]
        for (const p of prims) {
          if (p.$) {
            path.prims.push({
              type: num(p.$.type, 0),
            })
          }
        }
      }
    }

    // Parse PrimPolyline (alternative format for prims)
    const primPolyline = (node as any).PrimPolyline
    if (primPolyline && typeof primPolyline === "string") {
      path.prims = ShapePath.parseEncodedPrimPolyline(primPolyline)
    }

    // If we have verts but no prims, generate prims based on PrimID or default to LineTo
    if (path.verts.length > 0 && path.prims.length === 0) {
      const primID = num((node.$ as any)?.PrimID, undefined)
      path.prims = ShapePath.generatePrimsFromVerts(path.verts, primID)
    }

    return path
  }

  /**
   * Parse encoded VertList string format
   * Format: V{x} {y}c{c}x{cx}c{cy}x{cpx}c{cpy}y{cpy}...
   * Example: V2.1156745 -12.3306c0x1c1x1.5871694c1y-12.3306V7.4007263 -12.3306...
   */
  static parseEncodedVertList(encoded: string): Vert[] {
    const verts: Vert[] = []
    // Split by V to get individual vertices
    const parts = encoded.split("V").filter((p) => p.trim())

    for (const part of parts) {
      // Extract x, y coordinates (first two numbers before 'c')
      const match = part.match(/^([-\d.]+)\s+([-\d.]+)/)
      if (match) {
        const x = parseFloat(match[1]!)
        const y = parseFloat(match[2]!)

        // Extract control point flag if present (c{value})
        const cMatch = part.match(/c(\d+)/)
        const c = cMatch ? parseInt(cMatch[1]!, 10) : undefined

        verts.push({ x, y, c })
      }
    }

    return verts
  }

  /**
   * Parse encoded PrimPolyline string format
   * This typically contains line-to commands, each prim is type 0 (LineTo)
   */
  static parseEncodedPrimPolyline(encoded: string): Prim[] {
    const prims: Prim[] = []
    // Count number of vertices - each gets a LineTo prim (type 0)
    // This is a simplified approach - may need refinement based on actual format
    const vertCount = (encoded.match(/[-\d.]+\s+[-\d.]+/g) || []).length
    for (let i = 0; i < vertCount; i++) {
      prims.push({ type: 0 }) // LineTo
    }
    return prims
  }

  /**
   * Generate primitives from vertices based on PrimID
   * PrimID meanings:
   * - 0: Simple polyline (all LineTo)
   * - 2: Rounded rectangle with bezier curves at corners
   * - 3: Other curve type
   */
  static generatePrimsFromVerts(verts: Vert[], primID?: number): Prim[] {
    const prims: Prim[] = []

    if (verts.length === 0) {
      return prims
    }

    // For PrimID=2 (rounded rectangles), typically has 8 vertices:
    // 4 corner curves (each needs a bezier) + 4 straight edges
    // Pattern: Line, Bezier, Line, Bezier, Line, Bezier, Line, Bezier
    if (primID === 2 && verts.length === 8) {
      // Rounded rectangle pattern
      for (let i = 0; i < 8; i++) {
        prims.push({ type: i % 2 === 0 ? 0 : 1 }) // Alternate LineTo(0) and BezierTo(1)
      }
    }
    // For PrimID=0 or unknown, generate LineTo for all vertices
    else {
      for (let i = 0; i < verts.length; i++) {
        prims.push({ type: 0 }) // LineTo
      }
    }

    return prims
  }
}

LightBurnBaseElement.register("Shape.Path", ShapePath)
