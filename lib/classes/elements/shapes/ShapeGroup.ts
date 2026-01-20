import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { ShapeBase } from "./ShapeBase"

export class ShapeGroup extends ShapeBase {
  children: LightBurnBaseElement[] = []

  constructor() {
    super()
    this.token = "Shape.Group"
  }

  override getXmlAttributes(): Record<
    string,
    string | number | boolean | undefined
  > {
    return {
      Type: "Group",
      ...this.getShapeXmlAttributes(),
    }
  }

  static override fromXmlJson(node: XmlJsonElement): ShapeGroup {
    const group = new ShapeGroup()
    const common = ShapeBase.readCommon(node)
    Object.assign(group, common)

    // Parse nested Shape children
    const shapes = (node as any).Children?.Shape || (node as any).Shape
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

  override toXml(indent = 0): string {
    const indentStr = "    ".repeat(indent)
    const tag = this.getXmlTag()
    const attrs = this.getXmlAttributes()

    // Build attribute string
    const attrPairs: string[] = []
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) {
        // Convert boolean to LightBurn format (True/False)
        if (typeof value === "boolean") {
          attrPairs.push(`${key}="${value ? "True" : "False"}"`)
        } else {
          attrPairs.push(`${key}="${value}"`)
        }
      }
    }
    const attrStr = attrPairs.length > 0 ? " " + attrPairs.join(" ") : ""

    const lines = [`${indentStr}<${tag}${attrStr}>`]

    // Add XForm element
    const xformXml = super.getChildren()[0]!.toXml(indent + 1)
    lines.push(xformXml)

    // Add <Children> element
    lines.push(`${"    ".repeat(indent + 1)}<Children>`)

    // Add child shapes
    for (const child of this.children) {
      lines.push(child.toXml(indent + 2))
    }

    // Close <Children>
    lines.push(`${"    ".repeat(indent + 1)}</Children>`)

    // Close <Shape>
    lines.push(`${indentStr}</${tag}>`)

    return lines.join("\n")
  }
}

LightBurnBaseElement.register("Shape.Group", ShapeGroup)
