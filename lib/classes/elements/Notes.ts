import { LightBurnBaseElement } from "../LightBurnBaseElement"
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { boolish, str } from "./_coerce"

export class Notes extends LightBurnBaseElement {
  showOnLoad?: boolean
  text?: string

  constructor() {
    super()
    this.token = "Notes"
  }

  static override fromXmlJson(node: XmlJsonElement): Notes {
    const notes = new Notes()

    if (node.$) {
      notes.showOnLoad = boolish(node.$.ShowOnLoad, undefined)
      notes.text = str(node.$.Notes, undefined)
    }

    return notes
  }
}

LightBurnBaseElement.register("Notes", Notes)
