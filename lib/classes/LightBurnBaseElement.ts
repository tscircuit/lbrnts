import { parseXml } from "../xml-parsing/parseXml"
import type {
  XmlJson,
  XmlJsonValue,
  XmlJsonElement,
} from "../xml-parsing/xml-parsing-types"

export class LightBurnBaseElement {
  token!: string
  static token: string

  getChildren(): LightBurnBaseElement[] {
    return []
  }

  getStringIndented(): string {
    return this.getString()
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n")
  }

  getString(): string {
    const children = this.getChildren()
    if (children.length === 0) {
      return `(${this.token})`
    }

    const lines = [`(${this.token}`]
    for (const p of children) {
      lines.push(p.getStringIndented())
    }
    lines.push(")")
    return lines.join("\n")
  }

  get [Symbol.toStringTag](): string {
    return this.getString()
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.getString()
  }

  // =========================== STATIC METHODS ===========================

  private static elementRegistry: Record<string, any> = {}
  private static shapeRegistry: Record<string, any> = {}

  /**
   * Should be called after class definition to register the class for parsing
   */
  static register(token: string, klass: any) {
    if (token.startsWith("Shape.")) {
      LightBurnBaseElement.shapeRegistry[token] = klass
    } else {
      LightBurnBaseElement.elementRegistry[token] = klass
    }
  }

  /**
   * Parse an XML string into registered LightBurnBaseElement instances
   */
  static parse(xml: string): LightBurnBaseElement | LightBurnBaseElement[] {
    // Clear any cached template data from previous parses
    // This is necessary for shape instancing to work correctly
    const ShapePath = LightBurnBaseElement.shapeRegistry["Shape.Path"]
    if (ShapePath && typeof ShapePath.clearTemplateRegistry === "function") {
      ShapePath.clearTemplateRegistry()
    }

    const xmlJson: XmlJson = parseXml(xml)
    return LightBurnBaseElement.parseXmlJson(xmlJson)
  }

  static fromXmlJson(node: XmlJsonElement): LightBurnBaseElement {
    throw new Error(
      `"${this.name}" class has not implemented fromXmlJson`,
    )
  }

  static parseXmlJson(
    xmlJson: XmlJsonValue,
  ): any {
    // Handle root object { RootTag: Element }
    if (
      xmlJson &&
      typeof xmlJson === "object" &&
      !Array.isArray(xmlJson) &&
      !("$" in xmlJson || "_" in xmlJson)
    ) {
      const keys = Object.keys(xmlJson)
      if (keys.length === 1) {
        const rootTag = keys[0]!
        const rootNode = (xmlJson as any)[rootTag]
        return LightBurnBaseElement.instantiateElement(rootTag, rootNode)
      }
    }

    // Handle arrays
    if (Array.isArray(xmlJson)) {
      return xmlJson.map((item) => LightBurnBaseElement.parseXmlJson(item))
    }

    // Handle primitives
    if (
      typeof xmlJson === "number" ||
      typeof xmlJson === "string" ||
      typeof xmlJson === "boolean" ||
      xmlJson === null
    ) {
      return xmlJson
    }

    throw new Error(
      `Couldn't parse XML JSON: ${JSON.stringify(xmlJson)}`,
    )
  }

  static instantiateElement(tag: string, node: XmlJsonElement): LightBurnBaseElement {
    // Special handling for Shape elements
    if (tag === "Shape") {
      const type = node.$?.Type as string | undefined
      if (!type) {
        throw new Error("Shape element missing Type attribute")
      }
      const shapeToken = `Shape.${type}`
      const ShapeClass = LightBurnBaseElement.shapeRegistry[shapeToken]
      if (ShapeClass) {
        return ShapeClass.fromXmlJson(node)
      }
      throw new Error(`Unknown shape type "${type}"`)
    }

    // Look up in element registry
    const ElementClass = LightBurnBaseElement.elementRegistry[tag]
    if (ElementClass) {
      return ElementClass.fromXmlJson(node)
    }

    throw new Error(`Unknown element "${tag}"`)
  }
}

// For backward compatibility
export { LightBurnBaseElement as BaseLightBurnElement }
