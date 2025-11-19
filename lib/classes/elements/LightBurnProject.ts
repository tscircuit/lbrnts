import { LightBurnBaseElement } from "../LightBurnBaseElement"
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { num, boolish, str } from "./_coerce"

export class LightBurnProject extends LightBurnBaseElement {
  appVersion?: string
  formatVersion?: string
  materialHeight?: number
  mirrorX?: boolean
  mirrorY?: boolean
  children: LightBurnBaseElement[] = []

  constructor() {
    super()
    this.token = "LightBurnProject"
  }

  static override fromXmlJson(node: XmlJsonElement): LightBurnProject {
    const project = new LightBurnProject()

    if (node.$) {
      project.appVersion = str(node.$.AppVersion, undefined)
      project.formatVersion = str(node.$.FormatVersion, undefined)
      project.materialHeight = num(node.$.MaterialHeight, undefined)
      project.mirrorX = boolish(node.$.MirrorX, undefined)
      project.mirrorY = boolish(node.$.MirrorY, undefined)
    }

    // Parse children
    const childTags = ["Thumbnail", "VariableText", "UIPrefs", "CutSetting", "Shape", "Notes"]
    for (const tag of childTags) {
      const childNode = (node as any)[tag]
      if (childNode) {
        if (Array.isArray(childNode)) {
          for (const item of childNode) {
            project.children.push(LightBurnBaseElement.instantiateElement(tag, item))
          }
        } else {
          project.children.push(LightBurnBaseElement.instantiateElement(tag, childNode))
        }
      }
    }

    return project
  }

  override getChildren(): LightBurnBaseElement[] {
    return this.children
  }
}

LightBurnBaseElement.register("LightBurnProject", LightBurnProject)
