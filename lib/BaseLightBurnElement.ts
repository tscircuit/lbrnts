import {parseXml} from "./xml-parsing/parseXml";

export class BaseLightBurnElement {
  abstract token: string;
  static token: string

  getChildren(): BaseLightBurnElement[] {
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

  static classes: Record<string, Record<string, any>> = {}

  /**
   * Should be called after class definition to register the class for parsing
   */
  static register(newClass: any) {
    if (!newClass.token) {
      throw new Error("Class must have a static override token")
    }
    const parentKey = newClass.parentToken ?? DEFAULT_PARENT_TOKEN
    const existing = BaseLightBurnElement.classes[newClass.token] ?? {}
    existing[parentKey] = newClass
    BaseLightBurnElement.classes[newClass.token] = existing
  }

  /**
   * Parse an XML string into registered BaseLightBurnElement instances
   */
  static parse(sexpr: string): BaseLightBurnElement[] {
    const xmlJson = parseXml(sexpr)

    return BaseLightBurnElement.parseXmlJson(xmlJson) as BaseLightBurnElement[]
  }

  static fromXmlJson(xmlJson: any): BaseLightBurnElement {
    throw new Error(
      `"${this.name}" class has not implemented fromSexprPrimitives`,
    )
  }

  static parseXmlJson(
    xmlJson: any,
  ): BaseLightBurnElement | BaseLightBurnElement[] | number | string | boolean | null {
    // if (
    //   Array.isArray(primitiveSexpr) &&
    //   primitiveSexpr.length >= 1 &&
    //   typeof primitiveSexpr[0] === "string"
    // ) {
    //   const classToken = primitiveSexpr[0] as string
    //   const classGroup = SxClass.classes[classToken]
    //   if (!classGroup) {
    //     throw new Error(
    //       `Class "${classToken}" not registered via SxClass.register`,
    //     )
    //   }
    //   const parentKey = parentToken ?? DEFAULT_PARENT_TOKEN
    //   const ClassDef: any =
    //     classGroup[parentKey] ?? classGroup[DEFAULT_PARENT_TOKEN]
    //   if (!ClassDef) {
    //     throw new Error(
    //       `Class "${classToken}" not registered for parent "${parentToken ?? "<root>"}"`,
    //     )
    //   }
    //   const args = primitiveSexpr.slice(1) as PrimitiveSExpr[]
    //   if (!("fromSexprPrimitives" in ClassDef)) {
    //     throw new Error(
    //       `Class "${classToken}" does not have a fromSexprPrimitives method`,
    //     )
    //   }
    //   const classInstance = ClassDef.fromSexprPrimitives(args)
    //   return classInstance
    // }

    // if (Array.isArray(primitiveSexpr)) {
    //   return primitiveSexpr.map((item) =>
    //     SxClass.parsePrimitiveSexpr(item, options),
    //   ) as any[]
    // }

    // if (
    //   typeof primitiveSexpr === "number" ||
    //   typeof primitiveSexpr === "string" ||
    //   typeof primitiveSexpr === "boolean" ||
    //   primitiveSexpr === null
    // ) {
    //   return primitiveSexpr as number | string | boolean | null
    // }

    throw new Error(
      `Couldn't parse XML JSON: ${JSON.stringify(xmlJson)}`,
    )
  }


}