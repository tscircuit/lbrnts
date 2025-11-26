import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { num } from "../_coerce"
import { type Mat, ShapeBase } from "./ShapeBase"

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
  // type meanings:
  // 0 = LineTo, 1 = BezierTo, 2 = Move/Hop (pen up move)
}

export interface ShapePathInit {
  verts?: Vert[]
  prims?: Prim[]
  isClosed?: boolean
  cutIndex?: number
  locked?: boolean
  xform?: Mat // Optional in init, will use default identity matrix if not provided
}

export class ShapePath extends ShapeBase {
  verts: Vert[] = []
  prims: Prim[] = []
  isClosed = true // Whether the path is closed (default) or open

  // Static registry to track shape templates by VertID/PrimID
  private static templateRegistry: Map<
    string,
    { verts: Vert[]; prims: Prim[]; isClosed: boolean }
  > = new Map()

  constructor(init?: ShapePathInit) {
    super()
    this.token = "Shape.Path"
    if (init) {
      if (init.verts !== undefined) this.verts = init.verts
      if (init.prims !== undefined) this.prims = init.prims
      if (init.isClosed !== undefined) this.isClosed = init.isClosed
      if (init.cutIndex !== undefined) this.cutIndex = init.cutIndex
      if (init.locked !== undefined) this.locked = init.locked
      if (init.xform !== undefined) this.xform = init.xform
    }
  }

  static clearTemplateRegistry() {
    ShapePath.templateRegistry.clear()
  }

  override getXmlAttributes(): Record<
    string,
    string | number | boolean | undefined
  > {
    return {
      Type: "Path",
      ...this.getShapeXmlAttributes(),
    }
  }

  override getChildren(): LightBurnBaseElement[] {
    const children = super.getChildren() // Get XForm if present

    // Add VertList
    if (this.verts.length > 0) {
      children.push(new VertListElement(this.verts))
    }

    // Add PrimList
    if (this.prims.length > 0) {
      children.push(
        new PrimListElement({
          prims: this.prims,
          isClosed: this.isClosed,
          vertsLength: this.verts.length,
        }),
      )
    }

    return children
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
        const verts = Array.isArray(vertList.Vert)
          ? vertList.Vert
          : [vertList.Vert]
        for (const v of verts) {
          if (v.$) {
            const vert: Vert = {
              x: num(v.$.x, 0),
              y: num(v.$.y, 0),
              c: num(v.$.c, undefined),
            }
            // Parse control points
            if (v.$.c0x !== undefined) vert.c0x = num(v.$.c0x, undefined)
            if (v.$.c0y !== undefined) vert.c0y = num(v.$.c0y, undefined)
            if (v.$.c1x !== undefined) vert.c1x = num(v.$.c1x, undefined)
            if (v.$.c1y !== undefined) vert.c1y = num(v.$.c1y, undefined)
            path.verts.push(vert)
          }
        }
      }
    }

    // Parse PrimList
    const primList = (node as any).PrimList
    if (primList) {
      // Handle string format
      if (typeof primList === "string") {
        // Check if it's the compact encoded format (e.g., "L0 1B1 2L2 3")
        if (primList.match(/[LBM]\d+\s+\d+/)) {
          path.prims = ShapePath.parseEncodedPrimList(primList)
        }
        // Handle simple string format (e.g., "LineOpen", "LineClosed")
        else if (primList.includes("Line")) {
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
      }
      // Handle structured XML format
      else if (primList.Prim) {
        const prims = Array.isArray(primList.Prim)
          ? primList.Prim
          : [primList.Prim]
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
    if (
      path.verts.length === 0 &&
      vertID !== undefined &&
      primID !== undefined
    ) {
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
   * Format: V{x} {y}c{flag}c0x{value}c0y{value}c1x{value}c1y{value}
   * Example: V2.1156745 -12.3306c0x1c1x1.5871694c1y-12.3306
   *
   * Control points are encoded as:
   * - c0x{value}c0y{value} = control point 0 (outgoing handle when this vertex is START of Bezier)
   * - c1x{value}c1y{value} = control point 1 (incoming handle when this vertex is END of Bezier)
   * - c0x1 or c1x1 (value of exactly "1" without corresponding y) = "no handle" marker, not a coordinate
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
        // Pattern: c0x{value} followed optionally by c0y{value}
        // If c0x is "1" without a c0y, it's a "no handle" marker
        // If c0x has a corresponding c0y, they are real coordinates
        const c0xMatch = part.match(/c0x([-\d.]+)/)
        const c0yMatch = part.match(/c0y([-\d.]+)/)

        // c0 is a real coordinate only if BOTH c0x and c0y are present
        // (per spec, "c0x1" alone means "no left handle")
        if (c0xMatch && c0yMatch) {
          vert.c0x = parseFloat(c0xMatch[1]!)
          vert.c0y = parseFloat(c0yMatch[1]!)
        }

        const c1xMatch = part.match(/c1x([-\d.]+)/)
        const c1yMatch = part.match(/c1y([-\d.]+)/)

        // c1 is a real coordinate only if BOTH c1x and c1y are present
        // (per spec, "c1x1" alone means "no right handle")
        if (c1xMatch && c1yMatch) {
          vert.c1x = parseFloat(c1xMatch[1]!)
          vert.c1y = parseFloat(c1yMatch[1]!)
        }

        verts.push(vert)
      }
    }

    return verts
  }

  /**
   * Parse encoded PrimList string format
   * Format: {type}{fromIdx} {toIdx}{type}{fromIdx} {toIdx}...
   * Example: L0 1B1 2L2 3B3 4
   * where L = Line (type 0), B = Bezier (type 1)
   */
  static parseEncodedPrimList(encoded: string): Prim[] {
    const prims: Prim[] = []
    // Match each primitive: Letter followed by two numbers
    // Pattern: (L|B|M)(\d+)\s+(\d+)
    const primPattern = /([LBM])(\d+)\s+(\d+)/g
    const matches = encoded.matchAll(primPattern)

    for (const match of matches) {
      const primType = match[1]!
      // Note: fromIdx and toIdx are in the encoded string but we don't store them
      // The primitive's position in the array determines which vertices it connects
      prims.push({
        type: primType === "L" ? 0 : primType === "B" ? 1 : 2, // L=0 (Line), B=1 (Bezier), M=2 (Move)
      })
    }

    return prims
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

/**
 * Special element to represent a VertList
 */
class VertListElement extends LightBurnBaseElement {
  private verts: Vert[]

  constructor(verts: Vert[]) {
    super()
    this.token = "VertList"
    this.verts = verts
  }

  override toXml(indent = 0): string {
    const indentStr = "    ".repeat(indent)

    // Build compact lbrn2-style encoded string
    // Format: V{x} {y}c{flag}c0x{value}c0y{value}c1x{value}c1y{value}
    // where {value} can be either:
    // - a single digit 0 or 1 (flag): c0x1 or c1x0
    // - a decimal coordinate: c1x1.5871694 or c1y-12.3306
    let encoded = ""
    for (const vert of this.verts) {
      // Start with V followed by x y coordinates
      encoded += `V${vert.x} ${vert.y}`

      // Add control point flag if present
      if (vert.c !== undefined) {
        encoded += `c${vert.c}`
      }

      // Add control point 0 coordinates with c0x prefix
      if (vert.c0x !== undefined) {
        encoded += `c0x${vert.c0x}`
      }
      if (vert.c0y !== undefined) {
        encoded += `c0y${vert.c0y}`
      }

      // Add control point 1 coordinates with c1x prefix
      if (vert.c1x !== undefined) {
        encoded += `c1x${vert.c1x}`
      }
      if (vert.c1y !== undefined) {
        encoded += `c1y${vert.c1y}`
      }
    }

    return `${indentStr}<VertList>${encoded}</VertList>`
  }
}

/**
 * Special element to represent a PrimList
 */
class PrimListElement extends LightBurnBaseElement {
  private prims: Prim[]
  private isClosed: boolean
  private vertsLength: number

  constructor({
    prims,
    isClosed,
    vertsLength,
  }: {
    prims: Prim[]
    isClosed: boolean
    vertsLength: number
  }) {
    super()
    this.token = "PrimList"
    this.prims = prims
    this.isClosed = isClosed
    this.vertsLength = vertsLength
  }

  override toXml(indent = 0): string {
    const indentStr = "    ".repeat(indent)

    // Build compact lbrn2-style encoded string
    // Format: L{fromIdx} {toIdx}B{fromIdx} {toIdx}M{fromIdx} {toIdx}...
    // where L = LineTo (type 0), B = BezierTo (type 1), M = Move (type 2)
    let subpathStart = 0
    const loopLength =
      this.isClosed && this.vertsLength === this.prims.length + 1
        ? this.prims.length
        : this.vertsLength
    let encoded = ""
    for (let i = 0; i < this.prims.length; i++) {
      const prim = this.prims[i]!
      const primType = prim.type === 0 ? "L" : prim.type === 1 ? "B" : "M"
      const fromIdx = i
      const hasNextVertex = i + 1 < loopLength
      const toIdx = hasNextVertex ? i + 1 : this.isClosed ? subpathStart : i

      if (prim.type === 2) {
        subpathStart = toIdx
      }
      encoded += `${primType}${fromIdx} ${toIdx}`
    }

    return `${indentStr}<PrimList>${encoded}</PrimList>`
  }
}

LightBurnBaseElement.register("Shape.Path", ShapePath)
