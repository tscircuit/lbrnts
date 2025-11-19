import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { ShapeBase } from "./ShapeBase"
import { num } from "../_coerce"

export interface Vert {
  x: number
  y: number
  c?: number // control point flag
  c0x?: number // control point 0 x coordinate
  c0y?: number // control point 0 y coordinate
  c1x?: number // control point 1 x coordinate
  c1y?: number // control point 1 y coordinate
}

export interface Prim {
  type: number
}

export class ShapePath extends ShapeBase {
  verts: Vert[] = []
  prims: Prim[] = []
  isClosed: boolean = true // Whether the path is closed (default) or open

  // Static registry to track shape templates by VertID/PrimID
  private static templateRegistry: Map<string, { verts: Vert[]; prims: Prim[]; isClosed: boolean }> = new Map()

  constructor() {
    super()
    this.token = "Shape.Path"
  }

  static clearTemplateRegistry() {
    this.templateRegistry.clear()
  }

  static override fromXmlJson(node: XmlJsonElement): ShapePath {
    const path = new ShapePath()
    const common = ShapeBase.readCommon(node)
    Object.assign(path, common)

    // Get VertID and PrimID from attributes
    const vertID = num((node.$ as any)?.VertID, undefined)
    const primID = num((node.$ as any)?.PrimID, undefined)
    const templateKey = `${vertID}_${primID}`

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
      // Handle string format (e.g., "LineOpen", "LineClosed")
      if (typeof primList === "string") {
        // For string-based PrimLists, we need one primitive per vertex
        // Each primitive describes how to get FROM that vertex TO the next vertex
        // For an open line with N vertices, we need N-1 primitives (no closing segment)
        // For a closed line with N vertices, we need N primitives (includes closing segment)
        const isOpen = primList.includes("Open")
        path.isClosed = !isOpen
        const primCount = isOpen ? path.verts.length - 1 : path.verts.length
        for (let i = 0; i < primCount; i++) {
          path.prims.push({ type: 0 }) // LineTo
        }
      }
      // Handle structured XML format
      else if (primList.Prim) {
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

    // If this shape has vert/prim data, register it as a template
    if (path.verts.length > 0 && vertID !== undefined && primID !== undefined) {
      ShapePath.templateRegistry.set(templateKey, {
        verts: path.verts,
        prims: path.prims,
        isClosed: path.isClosed,
      })
    }

    // If this shape has no vert/prim data but has VertID/PrimID, copy from template
    if (path.verts.length === 0 && vertID !== undefined && primID !== undefined) {
      const template = ShapePath.templateRegistry.get(templateKey)
      if (template) {
        // Deep copy the verts and prims from the template
        path.verts = template.verts.map((v) => ({ ...v }))
        path.prims = template.prims.map((p) => ({ ...p }))
        path.isClosed = template.isClosed
      }
    }

    // If we have verts but no prims, generate prims based on PrimID or default to LineTo
    if (path.verts.length > 0 && path.prims.length === 0) {
      path.prims = ShapePath.generatePrimsFromVerts(path.verts, primID)
    }

    return path
  }

  /**
   * Parse encoded VertList string format
   * Format: V{x} {y}c{flag}x{flag}c{flag}x{c1x}c{flag}y{c1y}...
   * Example: V2.1156745 -12.3306c0x1c1x1.5871694c1y-12.3306
   *
   * Control points are encoded as:
   * - c0x{value}c0y{value} = control point 0 (when both present)
   * - c1x{value}c1y{value} = control point 1 (when both present)
   * - c{num}x{num} alone (like c0x1) = flag, not a coordinate
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

        const vert: Vert = { x, y }

        // Extract control point flag if present (first c{value} after coords)
        const cMatch = part.match(/c(\d+)/)
        if (cMatch) {
          vert.c = parseInt(cMatch[1]!, 10)
        }

        // Extract control point coordinates
        // Only treat as coordinates if both x and y are present with decimal values
        // c0x{decimal}c0y{decimal} or c1x{decimal}c1y{decimal}
        const c0xMatch = part.match(/c0x([-\d.]+)/)
        const c0yMatch = part.match(/c0y([-\d.]+)/)
        const c1xMatch = part.match(/c1x([-\d.]+)/)
        const c1yMatch = part.match(/c1y([-\d.]+)/)

        // Only set control points if we have both x and y, and they're real coordinates (have decimals or are multi-digit)
        if (
          c0xMatch &&
          c0yMatch &&
          (c0xMatch[1]!.includes(".") || c0xMatch[1]!.length > 1)
        ) {
          vert.c0x = parseFloat(c0xMatch[1]!)
          vert.c0y = parseFloat(c0yMatch[1]!)
        }

        if (
          c1xMatch &&
          c1yMatch &&
          (c1xMatch[1]!.includes(".") || c1xMatch[1]!.length > 1)
        ) {
          vert.c1x = parseFloat(c1xMatch[1]!)
          vert.c1y = parseFloat(c1yMatch[1]!)
        }

        verts.push(vert)
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
