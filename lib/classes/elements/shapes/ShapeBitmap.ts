import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { ShapeBase } from "./ShapeBase"
import { num, str } from "../_coerce"

export class ShapeBitmap extends ShapeBase {
  w?: number
  h?: number
  dataBase64?: string
  props: Record<string, any> = {}

  constructor() {
    super()
    this.token = "Shape.Bitmap"
  }

  static override fromXmlJson(node: XmlJsonElement): ShapeBitmap {
    const bitmap = new ShapeBitmap()
    const common = ShapeBase.readCommon(node)
    Object.assign(bitmap, common)

    if (node.$) {
      bitmap.w = num(node.$.W, undefined)
      bitmap.h = num(node.$.H, undefined)
    }

    // Parse Data.Source for base64 image data
    const data = (node as any).Data
    if (data?.$?.Source) {
      bitmap.dataBase64 = str(data.$.Source, undefined)
    }

    // Store additional children in props
    for (const [key, value] of Object.entries(node)) {
      if (key !== "$" && key !== "_" && key !== "XForm" && key !== "Data") {
        bitmap.props[key] = value
      }
    }

    return bitmap
  }
}

LightBurnBaseElement.register("Shape.Bitmap", ShapeBitmap)
