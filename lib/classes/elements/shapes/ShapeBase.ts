import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { boolish, num, str } from "../_coerce"

export type Mat = [
  a: number,
  b: number,
  c: number,
  d: number,
  tx: number,
  ty: number,
]

export abstract class ShapeBase extends LightBurnBaseElement {
  cutIndex?: number
  locked?: boolean
  xform?: Mat

  protected getShapeXmlAttributes(): Record<
    string,
    string | number | boolean | undefined
  > {
    return {
      CutIndex: this.cutIndex,
      Locked: this.locked,
    }
  }

  override getChildren(): LightBurnBaseElement[] {
    const children: LightBurnBaseElement[] = []

    // Add XForm as a special child element if present
    if (this.xform) {
      const xformElement = new XFormElement(this.xform)
      children.push(xformElement)
    }

    return children
  }

  static readCommon(node: XmlJsonElement): {
    cutIndex?: number
    locked?: boolean
    xform?: Mat
  } {
    const common: { cutIndex?: number; locked?: boolean; xform?: Mat } = {}

    if (node.$) {
      if (node.$.CutIndex !== undefined) {
        common.cutIndex = num(node.$.CutIndex, undefined)
      }
      if (node.$.Locked !== undefined) {
        common.locked = boolish(node.$.Locked, undefined)
      }
    }

    // Parse XForm if present
    const xformNode = (node as any).XForm
    if (xformNode) {
      // XForm could be a string directly or an object with _
      const xformText =
        typeof xformNode === "string" ? xformNode : str(xformNode._, "")
      if (xformText) {
        const parts = xformText.trim().split(/\s+/).map(Number)
        if (parts.length === 6) {
          common.xform = parts as Mat
        }
      }
    }

    return common
  }
}

/**
 * Special element to represent the XForm transformation matrix
 */
class XFormElement extends LightBurnBaseElement {
  private mat: Mat

  constructor(mat: Mat) {
    super()
    this.token = "XForm"
    this.mat = mat
  }

  override toXml(indent = 0): string {
    const indentStr = "    ".repeat(indent)
    const value = this.mat.join(" ")
    return `${indentStr}<XForm>${value}</XForm>`
  }
}
