import { LightBurnBaseElement } from "../LightBurnBaseElement"
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { str } from "./_coerce"

export class Thumbnail extends LightBurnBaseElement {
  pngBase64?: string

  constructor() {
    super()
    this.token = "Thumbnail"
  }

  static override fromXmlJson(node: XmlJsonElement): Thumbnail {
    const thumbnail = new Thumbnail()

    if (node.$) {
      thumbnail.pngBase64 = str(node.$.Source, undefined)
    }

    return thumbnail
  }
}

LightBurnBaseElement.register("Thumbnail", Thumbnail)
