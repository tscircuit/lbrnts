import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { num } from "../_coerce"
import { ShapeBase } from "./ShapeBase"

export class ShapePolygon extends ShapeBase {
  rx?: number
  ry?: number
  n?: number

  constructor() {
    super()
    this.token = "Shape.Polygon"
  }

  override getXmlAttributes(): Record<
    string,
    string | number | boolean | undefined
  > {
    return {
      Type: "Polygon",
      ...this.getShapeXmlAttributes(),
      Rx: this.rx,
      Ry: this.ry,
      N: this.n,
    }
  }

  static override fromXmlJson(node: XmlJsonElement): ShapePolygon {
    const polygon = new ShapePolygon()
    const common = ShapeBase.readCommon(node)
    Object.assign(polygon, common)

    if (node.$) {
      const width = num(node.$.W, undefined)
      const height = num(node.$.H, undefined)
      polygon.rx = num(node.$.Rx, width !== undefined ? width / 2 : undefined)
      polygon.ry = num(node.$.Ry, height !== undefined ? height / 2 : undefined)
      polygon.n = num(node.$.N, undefined)
    }

    return polygon
  }
}

LightBurnBaseElement.register("Shape.Polygon", ShapePolygon)
