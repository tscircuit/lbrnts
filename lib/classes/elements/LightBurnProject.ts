import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../LightBurnBaseElement"
import { boolish, num, str } from "./_coerce"

export interface LightBurnProjectInit {
  appVersion?: string
  formatVersion?: string
  materialHeight?: number
  mirrorX?: boolean
  mirrorY?: boolean
  children?: LightBurnBaseElement[]
}

export class LightBurnProject extends LightBurnBaseElement {
  appVersion?: string
  formatVersion?: string
  materialHeight?: number
  mirrorX?: boolean
  mirrorY?: boolean
  children: LightBurnBaseElement[] = []

  constructor(init?: LightBurnProjectInit) {
    super()
    this.token = "LightBurnProject"
    if (init) {
      if (init.appVersion !== undefined) this.appVersion = init.appVersion
      if (init.formatVersion !== undefined)
        this.formatVersion = init.formatVersion
      if (init.materialHeight !== undefined)
        this.materialHeight = init.materialHeight
      if (init.mirrorX !== undefined) this.mirrorX = init.mirrorX
      if (init.mirrorY !== undefined) this.mirrorY = init.mirrorY
      if (init.children !== undefined) this.children = init.children
    }
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
    const childTags = [
      "Thumbnail",
      "VariableText",
      "UIPrefs",
      "CutSetting",
      "Shape",
      "Notes",
    ]
    for (const tag of childTags) {
      const childNode = (node as any)[tag]
      if (childNode) {
        if (Array.isArray(childNode)) {
          for (const item of childNode) {
            project.children.push(
              LightBurnBaseElement.instantiateElement(tag, item),
            )
          }
        } else {
          project.children.push(
            LightBurnBaseElement.instantiateElement(tag, childNode),
          )
        }
      }
    }

    return project
  }

  override getChildren(): LightBurnBaseElement[] {
    return this.children
  }

  override getXmlAttributes(): Record<
    string,
    string | number | boolean | undefined
  > {
    return {
      AppVersion: this.appVersion,
      FormatVersion: this.formatVersion,
      MaterialHeight: this.materialHeight,
      MirrorX: this.mirrorX,
      MirrorY: this.mirrorY,
    }
  }
}

LightBurnBaseElement.register("LightBurnProject", LightBurnProject)
