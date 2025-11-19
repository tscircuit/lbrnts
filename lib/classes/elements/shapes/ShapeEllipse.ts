import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { ShapeBase } from "./ShapeBase"
import { num } from "../_coerce"

export class ShapeEllipse extends ShapeBase {
  rx?: number
  ry?: number

  constructor() {
    super()
    this.token = "Shape.Ellipse"
  }

  static override fromXmlJson(node: XmlJsonElement): ShapeEllipse {
    const ellipse = new ShapeEllipse()
    const common = ShapeBase.readCommon(node)
    Object.assign(ellipse, common)

    if (node.$) {
      ellipse.rx = num(node.$.Rx, undefined)
      ellipse.ry = num(node.$.Ry, undefined)
    }

    return ellipse
  }
}

LightBurnBaseElement.register("Shape.Ellipse", ShapeEllipse)
