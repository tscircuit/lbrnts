import { XMLParser } from "fast-xml-parser"
import type { XmlJson } from "./xml-parsing-types"

const parser = new XMLParser({
  ignoreAttributes: false, // keep attributes
  attributeNamePrefix: "", // attributes go under '$' in your types; we'll remap below
  allowBooleanAttributes: true,
  parseAttributeValue: false, // keep as strings; we'll coerce per-class
})

export const parseXml = (xml: string): XmlJson => {
  const raw = parser.parse(xml) as Record<string, any>
  // Normalize to your XmlJson shape:
  // - FXP uses attributes directly on the node; your types expect them in `node.$`.
  function normalize(value: any): any {
    if (value === null || typeof value !== "object") return value
    if (Array.isArray(value)) return value.map(normalize)

    const out: any = {}
    const attrs: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith("@_")) {
        attrs[k.slice(2)] = v
      } else if (k === "#text") {
        out._ = v
      } else {
        out[k] = normalize(v)
      }
    }
    if (Object.keys(attrs).length) out.$ = attrs
    return out
  }

  const rootKey = Object.keys(raw)[0]
  if (!rootKey) {
    throw new Error("Failed to parse XML: no root element found")
  }
  const root = normalize(raw[rootKey])
  return { [rootKey]: root } as XmlJson
}
