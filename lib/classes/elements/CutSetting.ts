import { LightBurnBaseElement } from "../LightBurnBaseElement"
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { num, str } from "./_coerce"

export class CutSetting extends LightBurnBaseElement {
  type: string = "Cut"
  index?: number
  name?: string
  params: Record<string, any> = {}

  constructor() {
    super()
    this.token = "CutSetting"
  }

  static override fromXmlJson(node: XmlJsonElement): CutSetting {
    const cs = new CutSetting()

    if (node.$) {
      cs.type = str(node.$.type, "Cut")
    }

    // Parse child elements
    if ((node as any).index?.$) {
      cs.index = num((node as any).index.$.Value, undefined)
    }
    if ((node as any).name?.$) {
      cs.name = str((node as any).name.$.Value, undefined)
    }

    // Store other children in params
    for (const [key, value] of Object.entries(node)) {
      if (key !== "$" && key !== "_" && key !== "index" && key !== "name") {
        if (value && typeof value === "object") {
          const val = (value as any).$?.Value
          if (val !== undefined) {
            cs.params[key] = val
          }
        }
      }
    }

    return cs
  }
}

LightBurnBaseElement.register("CutSetting", CutSetting)
