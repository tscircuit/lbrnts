import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { num, boolish, str } from "../_coerce"

export type Mat = [a: number, b: number, c: number, d: number, tx: number, ty: number]

export abstract class ShapeBase extends LightBurnBaseElement {
  cutIndex?: number
  locked?: boolean
  xform?: Mat

  static readCommon(node: XmlJsonElement): { cutIndex?: number; locked?: boolean; xform?: Mat } {
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
      const xformText = typeof xformNode === 'string' ? xformNode : str(xformNode._, "")
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
