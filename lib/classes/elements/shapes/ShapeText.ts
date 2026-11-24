import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { str } from "../_coerce"
import { ShapeBase } from "./ShapeBase"
import { ShapePath } from "./ShapePath"

export class ShapeText extends ShapeBase {
  text?: string
  font?: string
  backupPath?: ShapePath

  constructor() {
    super()
    this.token = "Shape.Text"
  }

  override getXmlAttributes(): Record<
    string,
    string | number | boolean | undefined
  > {
    return {
      Type: "Text",
      Text: this.text,
      Font: this.font,
      ...this.getShapeXmlAttributes(),
    }
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
