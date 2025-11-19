import { LightBurnBaseElement } from "../LightBurnBaseElement"
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { num, boolish } from "./_coerce"

export class VariableText extends LightBurnBaseElement {
  start?: number
  end?: number
  current?: number
  increment?: number
  autoAdvance?: boolean

  constructor() {
    super()
    this.token = "VariableText"
  }

  static override fromXmlJson(node: XmlJsonElement): VariableText {
    const vt = new VariableText()

    // Parse child elements like <Start Value="..."/>
    if ((node as any).Start?.$) {
      vt.start = num((node as any).Start.$.Value, undefined)
    }
    if ((node as any).End?.$) {
      vt.end = num((node as any).End.$.Value, undefined)
    }
    if ((node as any).Current?.$) {
      vt.current = num((node as any).Current.$.Value, undefined)
    }
    if ((node as any).Increment?.$) {
      vt.increment = num((node as any).Increment.$.Value, undefined)
    }
    if ((node as any).AutoAdvance?.$) {
      vt.autoAdvance = boolish((node as any).AutoAdvance.$.Value, undefined)
    }

    return vt
  }
}

LightBurnBaseElement.register("VariableText", VariableText)
