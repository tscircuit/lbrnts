import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { ShapeBase } from "./ShapeBase"
import { num } from "../_coerce"

export class ShapeRect extends ShapeBase {
  w?: number
  h?: number
  cr?: number

  constructor() {
    super()
    this.token = "Shape.Rect"
  }

  static override fromXmlJson(node: XmlJsonElement): ShapeRect {
    const rect = new ShapeRect()
    const common = ShapeBase.readCommon(node)
    Object.assign(rect, common)

    if (node.$) {
      rect.w = num(node.$.W, undefined)
      rect.h = num(node.$.H, undefined)
      rect.cr = num(node.$.Cr, undefined)
    }

    return rect
  }
}

LightBurnBaseElement.register("Shape.Rect", ShapeRect)
