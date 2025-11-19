import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { ShapeBase } from "./ShapeBase"
import { str } from "../_coerce"
import { ShapePath } from "./ShapePath"

export class ShapeText extends ShapeBase {
  text?: string
  font?: string
  backupPath?: ShapePath

  constructor() {
    super()
    this.token = "Shape.Text"
  }

  static override fromXmlJson(node: XmlJsonElement): ShapeText {
    const text = new ShapeText()
    const common = ShapeBase.readCommon(node)
    Object.assign(text, common)

    if (node.$) {
      text.text = str(node.$.Text, undefined)
      text.font = str(node.$.Font, undefined)
    }

    // Optionally parse BackupPath
    const backupPath = (node as any).BackupPath
    if (backupPath) {
      text.backupPath = ShapePath.fromXmlJson(backupPath)
    }

    return text
  }
}

LightBurnBaseElement.register("Shape.Text", ShapeText)
