import { LightBurnBaseElement } from "../LightBurnBaseElement"
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { str } from "./_coerce"

export class UIPrefs extends LightBurnBaseElement {
  prefs: Record<string, string> = {}

  constructor() {
    super()
    this.token = "UIPrefs"
  }

  static override fromXmlJson(node: XmlJsonElement): UIPrefs {
    const ui = new UIPrefs()

    // Iterate over all keys except $ and _
    for (const [key, value] of Object.entries(node)) {
      if (key !== "$" && key !== "_" && value && typeof value === "object") {
        const val = (value as any).$?.Value
        if (val !== undefined) {
          ui.prefs[key] = str(val)
        }
      }
    }

    return ui
  }
}

LightBurnBaseElement.register("UIPrefs", UIPrefs)
