import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { ShapeBase } from "./ShapeBase"

export class ShapeGroup extends ShapeBase {
  children: LightBurnBaseElement[] = []

  constructor() {
    super()
    this.token = "Shape.Group"
  }

  static override fromXmlJson(node: XmlJsonElement): ShapeGroup {
    const group = new ShapeGroup()
    const common = ShapeBase.readCommon(node)
    Object.assign(group, common)

    // Parse nested Shape children
    const shapes = (node as any).Shape
    if (shapes) {
      if (Array.isArray(shapes)) {
        for (const shape of shapes) {
          group.children.push(
            LightBurnBaseElement.instantiateElement("Shape", shape),
          )
        }
      } else {
        group.children.push(
          LightBurnBaseElement.instantiateElement("Shape", shapes),
        )
      }
    }

    return group
  }

  override getChildren(): LightBurnBaseElement[] {
    // Get XForm from parent
    const baseChildren = super.getChildren()
    // Add group's children
    return [...baseChildren, ...this.children]
  }
}

LightBurnBaseElement.register("Shape.Group", ShapeGroup)
