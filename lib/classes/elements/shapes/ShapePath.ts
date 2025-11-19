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
    if (vertList?.Vert) {
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

    // Parse PrimList
    const primList = (node as any).PrimList
    if (primList?.Prim) {
      const prims = Array.isArray(primList.Prim) ? primList.Prim : [primList.Prim]
      for (const p of prims) {
        if (p.$) {
          path.prims.push({
            type: num(p.$.type, 0),
          })
        }
      }
    }

    return path
  }
}

LightBurnBaseElement.register("Shape.Path", ShapePath)
