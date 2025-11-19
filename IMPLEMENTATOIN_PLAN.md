Below is a concrete, prescriptive implementation plan you can follow to finish the library: define all LightBurn element classes, wire up registration and parsing, and implement the SVG generator. I’ve included file-by-file instructions, API decisions, class templates (ready to paste), and test coverage you can add immediately.

> **Important note you requested**: at the **end of every class file**, call
> `LightBurnBaseElement.register("NewElementName", ElementClass)`.

---

## 0) Quick diagnosis of the current repo (what to fix first)

1. **Naming mismatch**
   You have `BaseLightBurnElement` but your requirement says `LightBurnBaseElement.register(...)`.
   **Plan**: Provide a `LightBurnBaseElement` symbol (alias or rename) so class files can call the exact API you specified.

2. **Broken import path**
   `lib/classes/BaseLightBurnElement.ts` imports `./xml-parsing/parseXml`, but the real folder is `lib/xml-parsing`.
   **Plan**: fix to `../xml-parsing/parseXml`.

3. **`parseXml` currently unsafely wraps `xml2js.parseString`**
   `xml2js.parseString` is async; the current wrapper returns before the callback fires.
   **Plan (pick one)**:
   _A)_ keep a **synchronous** parse by switching to `fast-xml-parser` (recommended; keeps your class API synchronous), or
   _B)_ make parsing **async** (`parseXml` returns a `Promise`) and adapt the Base class to `parseAsync`.

   Below I assume **Option A (sync)** because it keeps your class APIs simple and aligns with the current code style.

---

## 1) Foundation

### 1.1 Rename/alias the base class

**File**: `lib/classes/BaseLightBurnElement.ts` → **rename to** `lib/classes/LightBurnBaseElement.ts` (or keep the filename and add an alias export).

Update the class to:

- Support **string-keyed registration** (your required call pattern).
- Maintain **two registries**:

  - **Element registry** keyed by tag name, e.g. `"LightBurnProject"`, `"CutSetting"`, `"Shape"`, `"Thumbnail"`, etc.
  - **Shape subtype registry** keyed by `"Shape.Rect"`, `"Shape.Ellipse"`, etc. (because `<Shape>` uses a `Type` attribute).

- Provide a **factory** to resolve the correct class for each XML node.
- Provide a robust **`parseXmlJson`** that can walk xml2js/FXP-shaped JSON.

**Patch (drop‑in)**:

```ts
// lib/classes/LightBurnBaseElement.ts
import { parseXml } from "../xml-parsing/parseXml"
import type {
  XmlJson,
  XmlJsonValue,
  XmlJsonElement,
} from "../xml-parsing/xml-parsing-types"

export abstract class LightBurnBaseElement {
  abstract token: string
  static token: string

  // ---- instance: tree printing helpers (already useful) ----
  getChildren(): LightBurnBaseElement[] {
    return []
  }
  getStringIndented(): string {
    return this.getString()
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n")
  }
  getString(): string {
    const children = this.getChildren()
    if (children.length === 0) return `(${this.token})`
    const lines = [`(${this.token}`]
    for (const c of children) lines.push(c.getStringIndented())
    lines.push(")")
    return lines.join("\n")
  }
  get [Symbol.toStringTag](): string {
    return this.getString()
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.getString()
  }

  // =================== STATIC REGISTRIES ===================
  private static elementRegistry = new Map<string, any>() // "LightBurnProject", "CutSetting", "Shape", ...
  private static shapeRegistry = new Map<string, any>() // "Shape.Rect", "Shape.Ellipse", ...

  /**
   * Register an element class.
   * Usage:
   *  LightBurnBaseElement.register("LightBurnProject", LightBurnProject)
   *  LightBurnBaseElement.register("Shape.Rect", ShapeRect)
   */
  static register(token: string, klass: any) {
    if (!token || typeof token !== "string") {
      throw new Error(
        "register(token, klass) requires a non-empty token string"
      )
    }
    if (!klass)
      throw new Error(`register("${token}", klass): klass must be provided`)
    if (token.startsWith("Shape.")) {
      this.shapeRegistry.set(token, klass)
    } else {
      this.elementRegistry.set(token, klass)
    }
  }

  // -------------------- Parse entrypoints -------------------
  /** Parse XML string into instances (root is expected to be LightBurnProject). */
  static parse(xml: string): LightBurnBaseElement[] | LightBurnBaseElement {
    const xmlJson: XmlJson = parseXml(xml)
    return this.parseXmlJson(xmlJson)
  }

  /** Override in subclasses */
  static fromXmlJson(_node: XmlJsonElement): LightBurnBaseElement {
    throw new Error(`"${this.name}" must implement fromXmlJson(node)`)
  }

  /**
   * Walk the XML-JSON structure and instantiate registered classes.
   * Accepts either the root (object with one key) or an XmlJsonElement.
   */
  static parseXmlJson(xmlJson: XmlJsonValue): any {
    if (xmlJson === null) return null
    if (typeof xmlJson !== "object") return xmlJson

    // xmlJson at the root from FXP/xml2js is usually { RootTag: XmlJsonElement }
    if (!Array.isArray(xmlJson)) {
      const obj = xmlJson as Record<string, XmlJsonValue>
      const keys = Object.keys(obj)
      if (keys.length === 1 && typeof obj[keys[0]] === "object") {
        const tag = keys[0]
        return this.instantiateElement(tag, obj[tag] as XmlJsonElement)
      }
      // Otherwise treat as an element already:
      return xmlJson
    }

    // arrays: map recursively
    return (xmlJson as XmlJsonValue[]).map((v) => this.parseXmlJson(v))
  }

  /** Instantiate by tag or shape subtype */
  private static instantiateElement(tag: string, node: XmlJsonElement): any {
    // 1) Direct element registry
    const Elem = this.elementRegistry.get(tag)
    if (Elem?.fromXmlJson) return Elem.fromXmlJson(node)

    // 2) Special: Shape subtypes (tag === "Shape")
    if (tag === "Shape") {
      const type = (node.$ as any)?.Type ?? (node as any).Type
      const token = `Shape.${type}`
      const ShapeKlass = this.shapeRegistry.get(token)
      if (!ShapeKlass?.fromXmlJson) {
        throw new Error(`No class registered for ${token}`)
      }
      return ShapeKlass.fromXmlJson(node)
    }

    // 3) Unknown element fallback
    return UnknownElement.fromXmlJson({
      ...node,
      $: { ...(node.$ as any), _Tag: tag },
    })
  }
}

// ---------------- Unknown element for forward-compat ----------------
export class UnknownElement extends LightBurnBaseElement {
  static token = "Unknown"
  token = UnknownElement.token
  constructor(readonly tag: string, readonly raw: XmlJsonElement) {
    super()
  }
  static fromXmlJson(node: XmlJsonElement) {
    // Stash original tag in $._Tag if provided (see instantiateElement).
    const tag = (node.$ as any)?._Tag ?? "Unknown"
    return new UnknownElement(tag, node)
  }
}
LightBurnBaseElement.register("Unknown", UnknownElement)

// (Optional) Keep backward-compat export if other files still import the old name:
export { LightBurnBaseElement as BaseLightBurnElement }
```

> With this in place, **every class** can finish with the exact call you specified:
> `LightBurnBaseElement.register("Token", ClassRef)`.

### 1.2 Make `parseXml` synchronous

**File**: `lib/xml-parsing/parseXml.ts`

- Replace `xml2js` with `fast-xml-parser` (FXP), which parses synchronously and returns JSON similar to what you typed.
- Update `package.json` to add a dependency: `"fast-xml-parser": "^4.5.0"` (or current).

**Patch**:

```ts
// lib/xml-parsing/parseXml.ts
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
  const root = normalize(raw[rootKey])
  return { [rootKey]: root } as XmlJson
}
```

_(If you strongly prefer `xml2js`, make `parseXml` async and add `LightBurnBaseElement.parseAsync`—then propagate `await` through your API and tests.)_

---

## 2) Element classes to implement (and how to register them)

> Directory suggestion:
>
> ```
> lib/classes/
>   LightBurnBaseElement.ts      // above
>   elements/
>     LightBurnProject.ts
>     Thumbnail.ts
>     VariableText.ts
>     UIPrefs.ts
>     CutSetting.ts
>     Notes.ts
>     shapes/
>       ShapeBase.ts
>       ShapeRect.ts
>       ShapeEllipse.ts
>       ShapePath.ts
>       ShapeGroup.ts
>       ShapeBitmap.ts
>       ShapeText.ts
> ```
>
> Keep each class contained and finish **every file** with `LightBurnBaseElement.register("<Token>", ClassRef)`.

Below are concrete, pared-down class templates you can paste and extend. They parse the commonly observed fields (see `LBRN_INFO.md` in your repo for deeper notes). They also **coerce** number/boolean-ish strings where appropriate.

> **Coercion helpers (shared):**

Create one small helper file:

```ts
// lib/classes/elements/_coerce.ts
export const num = (v: any, d = 0) => (v === undefined ? d : Number(v))
export const boolish = (v: any, d = false) => {
  if (v === undefined) return d
  if (typeof v === "boolean") return v
  const s = String(v).toLowerCase()
  return s === "true" || s === "1"
}
export const str = (v: any, d = "") => (v === undefined ? d : String(v))
```

### 2.1 Root project

```ts
// lib/classes/elements/LightBurnProject.ts
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../LightBurnBaseElement"
import { boolish, num, str } from "./_coerce"

export class LightBurnProject extends LightBurnBaseElement {
  static token = "LightBurnProject"
  token = LightBurnProject.token

  constructor(
    public appVersion: string,
    public formatVersion: number,
    public materialHeight: number,
    public mirrorX: boolean,
    public mirrorY: boolean,
    public children: LightBurnBaseElement[]
  ) {
    super()
  }

  static fromXmlJson(node: XmlJsonElement): LightBurnProject {
    const $ = node.$ || {}
    const appVersion = str($.AppVersion)
    const formatVersion = num($.FormatVersion)
    const materialHeight = num($.MaterialHeight)
    const mirrorX = boolish($.MirrorX)
    const mirrorY = boolish($.MirrorY)

    // Known child tags we care to instantiate directly; unknowns are allowed and become UnknownElement
    const childOrder = [
      "Thumbnail",
      "VariableText",
      "UIPrefs",
      "CutSetting",
      "Shape",
      "Notes",
    ]
    const children: LightBurnBaseElement[] = []

    for (const tag of childOrder) {
      const v = (node as any)[tag]
      if (!v) continue
      const arr = Array.isArray(v) ? v : [v]
      for (const item of arr) {
        const inst = LightBurnBaseElement["instantiateElement" as any](
          tag,
          item
        ) // use the private factory
        children.push(inst)
      }
    }
    return new LightBurnProject(
      appVersion,
      formatVersion,
      materialHeight,
      mirrorX,
      mirrorY,
      children
    )
  }

  override getChildren() {
    return this.children
  }
}

LightBurnBaseElement.register("LightBurnProject", LightBurnProject)
```

### 2.2 Thumbnail

```ts
// lib/classes/elements/Thumbnail.ts
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../LightBurnBaseElement"
import { str } from "./_coerce"

export class Thumbnail extends LightBurnBaseElement {
  static token = "Thumbnail"
  token = Thumbnail.token
  constructor(public pngBase64: string) {
    super()
  }
  static fromXmlJson(node: XmlJsonElement): Thumbnail {
    const $ = node.$ || {}
    return new Thumbnail(str(($ as any).Source))
  }
}
LightBurnBaseElement.register("Thumbnail", Thumbnail)
```

### 2.3 VariableText

```ts
// lib/classes/elements/VariableText.ts
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../LightBurnBaseElement"
import { num, boolish } from "./_coerce"

export class VariableText extends LightBurnBaseElement {
  static token = "VariableText"
  token = VariableText.token

  constructor(
    public start: number,
    public end: number,
    public current: number,
    public increment: number,
    public autoAdvance: boolean
  ) {
    super()
  }

  static fromXmlJson(node: XmlJsonElement): VariableText {
    const pick = (name: string, def = 0) =>
      num((node as any)[name]?.$?.Value, def)
    const start = pick("Start")
    const end = pick("End")
    const current = pick("Current")
    const increment = pick("Increment", 1)
    const autoAdvance = boolish((node as any).AutoAdvance?.$?.Value, false)
    return new VariableText(start, end, current, increment, autoAdvance)
  }
}
LightBurnBaseElement.register("VariableText", VariableText)
```

### 2.4 UIPrefs (map of name→Value)

```ts
// lib/classes/elements/UIPrefs.ts
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../LightBurnBaseElement"

export class UIPrefs extends LightBurnBaseElement {
  static token = "UIPrefs"
  token = UIPrefs.token
  constructor(public prefs: Record<string, string>) {
    super()
  }

  static fromXmlJson(node: XmlJsonElement): UIPrefs {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(node)) {
      if (k === "$" || k === "_") continue
      const val = (v as any)?.$?.Value
      if (val !== undefined) out[k] = String(val)
    }
    return new UIPrefs(out)
  }
}
LightBurnBaseElement.register("UIPrefs", UIPrefs)
```

### 2.5 CutSetting (layers)

```ts
// lib/classes/elements/CutSetting.ts
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../LightBurnBaseElement"
import { num, str } from "./_coerce"

export class CutSetting extends LightBurnBaseElement {
  static token = "CutSetting"
  token = CutSetting.token

  constructor(
    public type: "Cut" | "Tool" | string,
    public index: number,
    public name: string,
    public params: Record<string, string>
  ) {
    super()
  }

  static fromXmlJson(node: XmlJsonElement): CutSetting {
    const $ = node.$ || {}
    const type = String(($ as any).type ?? "Cut")
    const params: Record<string, string> = {}
    let index = 0,
      name = ""

    for (const [k, v] of Object.entries(node)) {
      if (k === "$" || k === "_") continue
      const val = (v as any)?.$?.Value
      if (val === undefined) continue
      if (k === "index") index = num(val)
      else if (k === "name") name = str(val)
      else params[k] = String(val)
    }
    return new CutSetting(type as any, index, name, params)
  }
}
LightBurnBaseElement.register("CutSetting", CutSetting)
```

### 2.6 Notes

```ts
// lib/classes/elements/Notes.ts
import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../LightBurnBaseElement"
import { boolish, str } from "./_coerce"

export class Notes extends LightBurnBaseElement {
  static token = "Notes"
  token = Notes.token
  constructor(public showOnLoad: boolean, public text: string) {
    super()
  }
  static fromXmlJson(node: XmlJsonElement): Notes {
    const $ = node.$ || {}
    return new Notes(boolish(($ as any).ShowOnLoad), str(($ as any).Notes))
  }
}
LightBurnBaseElement.register("Notes", Notes)
```

### 2.7 Shape subsystem

#### 2.7.1 Base shape (matrix + common attrs)

```ts
// lib/classes/elements/shapes/ShapeBase.ts
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { num } from "../_coerce"

export abstract class ShapeBase extends LightBurnBaseElement {
  abstract type: string // "Rect" | "Ellipse" | ...

  constructor(
    public cutIndex: number | null,
    public locked: boolean,
    public xform: [number, number, number, number, number, number] // a b c d tx ty
  ) {
    super()
  }

  static readCommon(node: XmlJsonElement) {
    const $ = node.$ || {}
    const cutIndex = $?.CutIndex !== undefined ? Number($?.CutIndex) : null
    const locked =
      String($?.Locked ?? "0").toLowerCase() === "1" ||
      String($?.Locked).toLowerCase() === "true"
    const xfText = String(
      (node as any).XForm?._ ?? (node as any).XForm ?? ""
    ).trim()
    const [a, b, c, d, tx, ty] = (xfText.split(/\s+/).map(Number) as any)
      .concat([1, 0, 0, 1, 0, 0])
      .slice(0, 6)
    return {
      cutIndex,
      locked,
      xform: [a, b, c, d, tx, ty] as [
        number,
        number,
        number,
        number,
        number,
        number
      ],
    }
  }
}
```

#### 2.7.2 Rect

```ts
// lib/classes/elements/shapes/ShapeRect.ts
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { ShapeBase } from "./ShapeBase"

export class ShapeRect extends ShapeBase {
  static token = "Shape.Rect"
  token = ShapeRect.token
  type = "Rect"
  constructor(
    cutIndex: number | null,
    locked: boolean,
    xform: [number, number, number, number, number, number],
    public w: number,
    public h: number,
    public cr: number // corner radius
  ) {
    super(cutIndex, locked, xform)
  }

  static fromXmlJson(node: XmlJsonElement): ShapeRect {
    const { cutIndex, locked, xform } = ShapeBase.readCommon(node)
    const $ = node.$ || {}
    return new ShapeRect(
      cutIndex,
      locked,
      xform,
      Number($.W ?? 0),
      Number($.H ?? 0),
      Number($.Cr ?? 0)
    )
  }
}
LightBurnBaseElement.register("Shape.Rect", ShapeRect)
```

#### 2.7.3 Ellipse

```ts
// lib/classes/elements/shapes/ShapeEllipse.ts
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { ShapeBase } from "./ShapeBase"

export class ShapeEllipse extends ShapeBase {
  static token = "Shape.Ellipse"
  token = ShapeEllipse.token
  type = "Ellipse"
  constructor(
    cutIndex: number | null,
    locked: boolean,
    xform: [number, number, number, number, number, number],
    public rx: number,
    public ry: number
  ) {
    super(cutIndex, locked, xform)
  }

  static fromXmlJson(node: XmlJsonElement): ShapeEllipse {
    const { cutIndex, locked, xform } = ShapeBase.readCommon(node)
    const $ = node.$ || {}
    const rx = Number($.Rx ?? $.rx ?? 0)
    const ry = Number($.Ry ?? $.ry ?? 0)
    return new ShapeEllipse(cutIndex, locked, xform, rx, ry)
  }
}
LightBurnBaseElement.register("Shape.Ellipse", ShapeEllipse)
```

#### 2.7.4 Path (VertList + PrimList)

```ts
// lib/classes/elements/shapes/ShapePath.ts
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { ShapeBase } from "./ShapeBase"

export type PathVert = {
  x: number
  y: number
  c0x?: number
  c0y?: number
  c1x?: number
  c1y?: number
}
export type PathPrim = { t: "L" | "B" | "M" | "C" | "Z"; vi: number[] }

export class ShapePath extends ShapeBase {
  static token = "Shape.Path"
  token = ShapePath.token
  type = "Path"
  constructor(
    cutIndex: number | null,
    locked: boolean,
    xform: [number, number, number, number, number, number],
    public verts: PathVert[],
    public prims: PathPrim[]
  ) {
    super(cutIndex, locked, xform)
  }

  static fromXmlJson(node: XmlJsonElement): ShapePath {
    const { cutIndex, locked, xform } = ShapeBase.readCommon(node)
    const verts: PathVert[] = []
    const prims: PathPrim[] = []

    const VL = (node as any).VertList
    if (VL?.Vert) {
      const arr = Array.isArray(VL.Vert) ? VL.Vert : [VL.Vert]
      for (const v of arr) {
        const $ = v.$ || {}
        verts.push({
          x: Number($.x),
          y: Number($.y),
          c0x: $.c0x !== undefined ? Number($.c0x) : undefined,
          c0y: $.c0y !== undefined ? Number($.c0y) : undefined,
          c1x: $.c1x !== undefined ? Number($.c1x) : undefined,
          c1y: $.c1y !== undefined ? Number($.c1y) : undefined,
        })
      }
    }

    const PL = (node as any).PrimList
    if (PL?.Prim) {
      const arr = Array.isArray(PL.Prim) ? PL.Prim : [PL.Prim]
      for (const p of arr) {
        const $ = p.$ || {}
        const t = String($.t ?? $.T ?? "L").toUpperCase() as PathPrim["t"]
        const vi = String($.vi ?? "")
          .split(",")
          .filter(Boolean)
          .map((n) => Number(n.trim()))
        prims.push({ t, vi })
      }
    }

    return new ShapePath(cutIndex, locked, xform, verts, prims)
  }
}
LightBurnBaseElement.register("Shape.Path", ShapePath)
```

#### 2.7.5 Group (recursive shapes)

```ts
// lib/classes/elements/shapes/ShapeGroup.ts
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { ShapeBase } from "./ShapeBase"

export class ShapeGroup extends ShapeBase {
  static token = "Shape.Group"
  token = ShapeGroup.token
  type = "Group"
  constructor(
    cutIndex: number | null,
    locked: boolean,
    xform: [number, number, number, number, number, number],
    public children: LightBurnBaseElement[]
  ) {
    super(cutIndex, locked, xform)
  }
  static fromXmlJson(node: XmlJsonElement): ShapeGroup {
    const { cutIndex, locked, xform } = ShapeBase.readCommon(node)
    const shapes: any[] = []
    const kids = (node as any).Shape
    if (kids) {
      const arr = Array.isArray(kids) ? kids : [kids]
      for (const item of arr) {
        shapes.push(
          LightBurnBaseElement["instantiateElement" as any]("Shape", item)
        )
      }
    }
    const group = new ShapeGroup(cutIndex, locked, xform, shapes)
    return group
  }
  override getChildren() {
    return this.children
  }
}
LightBurnBaseElement.register("Shape.Group", ShapeGroup)
```

#### 2.7.6 Bitmap

```ts
// lib/classes/elements/shapes/ShapeBitmap.ts
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { ShapeBase } from "./ShapeBase"

export class ShapeBitmap extends ShapeBase {
  static token = "Shape.Bitmap"
  token = ShapeBitmap.token
  type = "Bitmap"
  constructor(
    cutIndex: number | null,
    locked: boolean,
    xform: [number, number, number, number, number, number],
    public w: number,
    public h: number,
    public dataBase64: string,
    public props: Record<string, string>
  ) {
    super(cutIndex, locked, xform)
  }

  static fromXmlJson(node: XmlJsonElement): ShapeBitmap {
    const { cutIndex, locked, xform } = ShapeBase.readCommon(node)
    const $ = node.$ || {}
    const w = Number(($ as any).W ?? 0)
    const h = Number(($ as any).H ?? 0)
    const dataBase64 = String((node as any).Data?.$?.Source ?? "")
    const props: Record<string, string> = {}
    for (const [k, v] of Object.entries(node)) {
      if (["$", "_", "XForm", "Data"].includes(k)) continue
      const val = (v as any)?.$?.Value
      if (val !== undefined) props[k] = String(val)
    }
    return new ShapeBitmap(cutIndex, locked, xform, w, h, dataBase64, props)
  }
}
LightBurnBaseElement.register("Shape.Bitmap", ShapeBitmap)
```

#### 2.7.7 Text (with BackupPath optional)

```ts
// lib/classes/elements/shapes/ShapeText.ts
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import { ShapeBase } from "./ShapeBase"

export class ShapeText extends ShapeBase {
  static token = "Shape.Text"
  token = ShapeText.token
  type = "Text"
  constructor(
    cutIndex: number | null,
    locked: boolean,
    xform: [number, number, number, number, number, number],
    public text: string,
    public font?: string,
    public backupPath?: any // could reuse ShapePath model for outlines
  ) {
    super(cutIndex, locked, xform)
  }

  static fromXmlJson(node: XmlJsonElement): ShapeText {
    const { cutIndex, locked, xform } = ShapeBase.readCommon(node)
    const $ = node.$ || {}
    const text = String(($ as any).Text ?? "")
    const font = ($ as any).Font ? String(($ as any).Font) : undefined
    const backup = (node as any).BackupPath
      ? LightBurnBaseElement["instantiateElement" as any]("Shape", {
          ...(node as any).BackupPath,
          $: { Type: "Path" },
        })
      : undefined
    return new ShapeText(cutIndex, locked, xform, text, font, backup)
  }
}
LightBurnBaseElement.register("Shape.Text", ShapeText)
```

> With these registrations, the base factory will do the right thing when it sees `<Shape Type="Rect" ...>`, etc.

---

## 3) SVG generator implementation

**File**: `lib/svg-gen/generateLightBurnSvg.ts`

### 3.1 Goals

- Convert a parsed **`LightBurnProject`** (or array of elements containing shapes) to an `<svg>` string.

- Handle **Y‑up (LightBurn)** → **Y‑down (SVG)**. Two standard strategies:

  1. Wrap the entire content in a `<g transform="scale(1,-1) translate(0,-H)">`, or
  2. Adjust each matrix (negate Y axis) and invert path/coords.

  **Plan**: use a **single top-level flip** based on a computed height **H** (the project’s bounding box height). It’s simple and keeps per-shape code clean.

- Support at least the core shapes now: **Rect**, **Ellipse** (render as `<circle>/<ellipse>` depending on rx/ry), **Path** (convert prims+verts to a `d` string), **Group** (nest `<g>`), **Bitmap** (`<image href="data:image/png;base64,..." />`), and **Text** (emit `<text>` or fall back to its backup path).

- Style (stroke/fill): basic defaults are fine to start (e.g., `stroke="black" fill="none"`). Later you can pull colors from layers (`CutSetting`).

### 3.2 Bounding box and matrices

- Each shape carries an **affine matrix** `[a, b, c, d, tx, ty]`.
- For `Rect`/`Ellipse`/`Bitmap` we know the local box; we can transform its 4 corners to compute a global AABB.
- For `Path`, transform all vertices; for `Group`, compute union of children boxes.

**Helper**: small 2D math:

```ts
// lib/svg-gen/_math.ts
export type Mat = [number, number, number, number, number, number]
export type Pt = { x: number; y: number }

export const apply = (m: Mat, p: Pt): Pt => ({
  x: m[0] * p.x + m[2] * p.y + m[4],
  y: m[1] * p.x + m[3] * p.y + m[5],
})
export const mul = (a: Mat, b: Mat): Mat => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
]
export const matToSvg = (m: Mat) =>
  `matrix(${m[0]} ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]})`
```

### 3.3 Implementation (ready to paste)

```ts
// lib/svg-gen/generateLightBurnSvg.ts
import { LightBurnBaseElement } from "../classes/LightBurnBaseElement"
import type { Mat, Pt } from "./_math"
import { apply, matToSvg } from "./_math"
import { ShapeBase } from "../classes/elements/shapes/ShapeBase"
import { ShapeRect } from "../classes/elements/shapes/ShapeRect"
import { ShapeEllipse } from "../classes/elements/shapes/ShapeEllipse"
import { ShapePath } from "../classes/elements/shapes/ShapePath"
import { ShapeGroup } from "../classes/elements/shapes/ShapeGroup"
import { ShapeBitmap } from "../classes/elements/shapes/ShapeBitmap"
import { ShapeText } from "../classes/elements/shapes/ShapeText"
import { LightBurnProject } from "../classes/elements/LightBurnProject"

type BBox = { minX: number; minY: number; maxX: number; maxY: number }
const emptyBox = (): BBox => ({
  minX: Infinity,
  minY: Infinity,
  maxX: -Infinity,
  maxY: -Infinity,
})
const boxUnion = (a: BBox, b: BBox): BBox => ({
  minX: Math.min(a.minX, b.minX),
  minY: Math.min(a.minY, b.minY),
  maxX: Math.max(a.maxX, b.maxX),
  maxY: Math.max(a.maxY, b.maxY),
})

const addPts = (bb: BBox, pts: Pt[]) => {
  for (const p of pts) {
    if (p.x < bb.minX) bb.minX = p.x
    if (p.y < bb.minY) bb.minY = p.y
    if (p.x > bb.maxX) bb.maxX = p.x
    if (p.y > bb.maxY) bb.maxY = p.y
  }
}

function bboxOfShape(s: ShapeBase): BBox {
  if (s instanceof ShapeRect) {
    const { w, h, xform: m } = s
    const pts = [
      apply(m, { x: 0, y: 0 }),
      apply(m, { x: w, y: 0 }),
      apply(m, { x: w, y: h }),
      apply(m, { x: 0, y: h }),
    ]
    const bb = emptyBox()
    addPts(bb, pts)
    return bb
  }
  if (s instanceof ShapeEllipse) {
    // approximate ellipse bbox by transforming the 4 extreme points (works for pure scale/rotate/shear)
    const { rx, ry, xform: m } = s
    const pts = [
      apply(m, { x: +rx, y: 0 }),
      apply(m, { x: -rx, y: 0 }),
      apply(m, { x: 0, y: +ry }),
      apply(m, { x: 0, y: -ry }),
    ]
    const bb = emptyBox()
    addPts(bb, pts)
    return bb
  }
  if (s instanceof ShapeBitmap) {
    const { w, h, xform: m } = s
    const pts = [
      apply(m, { x: 0, y: 0 }),
      apply(m, { x: w, y: 0 }),
      apply(m, { x: w, y: h }),
      apply(m, { x: 0, y: h }),
    ]
    const bb = emptyBox()
    addPts(bb, pts)
    return bb
  }
  if (s instanceof ShapePath) {
    const m = s.xform
    const pts = s.verts.map((v) => apply(m, { x: v.x, y: v.y }))
    const bb = emptyBox()
    addPts(bb, pts)
    return bb
  }
  if (s instanceof ShapeGroup) {
    let bb = emptyBox()
    for (const ch of s.children) {
      if (ch instanceof ShapeBase) {
        bb = boxUnion(bb, bboxOfShape(ch))
      }
    }
    return bb
  }
  return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
}

function svgForShape(s: ShapeBase): string {
  const tr = matToSvg(s.xform)
  if (s instanceof ShapeRect) {
    const cr = Math.max(0, s.cr || 0)
    return `<g transform="${tr}"><rect x="0" y="0" width="${s.w}" height="${s.h}" rx="${cr}" ry="${cr}" stroke="black" fill="none"/></g>`
  }
  if (s instanceof ShapeEllipse) {
    // If rx==ry -> circle; else ellipse
    if (Math.abs(s.rx - s.ry) < 1e-9) {
      return `<g transform="${tr}"><circle cx="0" cy="0" r="${s.rx}" stroke="black" fill="none"/></g>`
    }
    return `<g transform="${tr}"><ellipse cx="0" cy="0" rx="${s.rx}" ry="${s.ry}" stroke="black" fill="none"/></g>`
  }
  if (s instanceof ShapePath) {
    // Build 'd' from prims/verts
    const V = s.verts
    let d = ""
    for (const prim of s.prims) {
      if (prim.t === "M") {
        const p = V[prim.vi[0]]
        d += `M ${p.x} ${p.y} `
      } else if (prim.t === "L") {
        for (const idx of prim.vi) {
          const p = V[idx]
          d += `L ${p.x} ${p.y} `
        }
      } else if (prim.t === "B" || prim.t === "C") {
        // cubic: each vertex has c0/c1; we assume vi groups form segments
        for (let i = 0; i < prim.vi.length; i += 2) {
          const a = V[prim.vi[i]],
            b = V[prim.vi[i + 1]]
          d += `C ${a.c1x} ${a.c1y} ${b.c0x} ${b.c0y} ${b.x} ${b.y} `
        }
      } else if (prim.t === "Z") {
        d += "Z "
      }
    }
    return `<g transform="${tr}"><path d="${d.trim()}" stroke="black" fill="none"/></g>`
  }
  if (s instanceof ShapeBitmap) {
    // Assume bitmap local origin (0,0) upper-left. For Y-flip we wrap later at root.
    const href = `data:image/png;base64,${s.dataBase64}`
    return `<g transform="${tr}"><image x="0" y="0" width="${s.w}" height="${s.h}" href="${href}" /></g>`
  }
  if (s instanceof ShapeText) {
    // Minimal: emit as <text> at local origin; could fallback to backupPath if present
    return `<g transform="${tr}"><text x="0" y="0" font-family="${
      s.font ?? "sans-serif"
    }" font-size="12" fill="black">${escapeXml(s.text)}</text></g>`
  }
  return ""
}

const escapeXml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      }[c]!)
  )

export const generateLightBurnSvg = (root: LightBurnBaseElement): string => {
  // Collect shapes from project (flat for now)
  const shapes: ShapeBase[] = []
  if (root instanceof LightBurnProject) {
    for (const ch of root.getChildren()) {
      if (ch instanceof ShapeBase) shapes.push(ch)
    }
  } else if (root instanceof ShapeBase) {
    shapes.push(root)
  } else if (Array.isArray(root)) {
    for (const node of root) if (node instanceof ShapeBase) shapes.push(node)
  }

  // Compute union bbox
  let bb = emptyBox()
  for (const s of shapes) bb = boxUnion(bb, bboxOfShape(s))
  const width = Math.max(0, bb.maxX - bb.minX) || 100
  const height = Math.max(0, bb.maxY - bb.minY) || 100

  // Root Y-flip: scale(1,-1) then translate(0, -height) so origin is top-left in SVG
  const flip = `matrix(1 0 0 -1 0 ${height.toFixed(6)})`

  const content = shapes.map(svgForShape).join("\n")

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `  <g transform="${flip}">`,
    `    ${content}`,
    `  </g>`,
    `</svg>`,
  ].join("\n")
}
```

> This generator is deliberately **conservative** (simple styling, correct geometry, correct Y-flip). You can later read stroke colors/fills from `CutSetting` and map `CutIndex` → `style`.

---

## 4) Parser entrypoint & exports

Create a friendly top-level API that mirrors your `README.md` expectations:

```ts
// index.ts
export { LightBurnBaseElement } from "./lib/classes/LightBurnBaseElement"
export { LightBurnProject } from "./lib/classes/elements/LightBurnProject"
export * as LightBurnShape from "./lib/classes/elements/shapes/ShapeBase" // optional re-exports
export { generateLightBurnSvg } from "./lib/svg-gen/generateLightBurnSvg"
```

_(Adjust to your preferred public surface; you might also export each concrete shape.)_

---

## 5) Tests you can add right now

### 5.1 Parsing + SVG snapshot (rect)

```ts
// tests/project-to-svg.test.ts
import { expect, test } from "bun:test"
import { LightBurnBaseElement } from "../lib/classes/LightBurnBaseElement"
import { generateLightBurnSvg } from "../lib/svg-gen/generateLightBurnSvg"

const lbrn2 = `<?xml version="1.0"?>
<LightBurnProject AppVersion="1.4.03" FormatVersion="1" MaterialHeight="0" MirrorX="False" MirrorY="False">
  <CutSetting type="Cut">
    <index Value="1"/><name Value="C01"/><speed Value="10"/>
  </CutSetting>
  <Shape Type="Rect" CutIndex="1" W="40" H="20" Cr="2">
    <XForm>1 0 0 1 30 30</XForm>
  </Shape>
</LightBurnProject>`

test("rect to svg snapshot", async () => {
  const proj = LightBurnBaseElement.parse(lbrn2)
  const svg = generateLightBurnSvg(proj as any)
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
```

### 5.2 Path sanity

Add a small path example with `VertList` + `PrimList` and assert it generates a `<path>` with a sane `d`.

---

## 6) Optional (but strongly recommended) features

You can stage these behind separate PRs:

1. **Round‑trip writer**: add a `toXml()` / `toXmlJson()` on each element and a `serializeProject()` that emits `<LightBurnProject>...`. Use `xmlbuilder2` for clean writing. **Preserve unknown attributes/elements** stored on `UnknownElement` instances.

2. **Layer styling in SVG**:

   - Map each `CutSetting`’s `index` → style (stroke color, dash, output vs tool).
   - Use `<g data-cut-index="2">` wrappers or CSS classes.

3. **Units helper**: verify everything is mm, provide convenience converters (`mmToPx`, `inToMm`, etc.) but keep geometry in mm internally.

4. **Geometry utils**:

   - Matrix compose/decompose, bounding boxes for Beziers (more accurate than extreme points), stroke widths, etc.

5. **Validation**:

   - Sanity-check transforms, reject NaNs, clamp huge corner radii.

6. **CLI**:

   - `bun run lbrn2svg input.lbrn2 > out.svg` using the above parser/generator.

---

## 7) Package & scripts

- Add dependency if you chose FXP:

  ```json
  // package.json
  {
    "dependencies": {
      "fast-xml-parser": "^4.5.0"
    }
  }
  ```

- Scripts:

  ```json
  {
    "scripts": {
      "test": "bun test",
      "lint": "biome check ."
    }
  }
  ```

---

## 8) Implementation checklist (copy into your PR)

- [ ] Rename / alias `BaseLightBurnElement` → **`LightBurnBaseElement`**.
- [ ] Fix `parseXml` to be synchronous (switch to **fast‑xml‑parser**) and correct import paths.
- [ ] Implement element factory + registries (element tags and shape subtypes).
- [ ] Add **LightBurnProject**, **Thumbnail**, **VariableText**, **UIPrefs**, **CutSetting**, **Notes** classes.
- [ ] Implement shape classes: **Rect**, **Ellipse**, **Path**, **Group**, **Bitmap**, **Text** (each registered with `LightBurnBaseElement.register("Shape.<Type>", Class)`).
- [ ] Implement **SVG generator** with top-level **Y-axis flip** and per-shape emitters.
- [ ] Add snapshot tests for Rect/Ellipse/Path; add one mixed project integration test.
- [ ] (Optional) Layer styling, writer, CLI.

---

## 9) Example: final line in every class file

To reinforce your requirement—**always end a class file with**:

```ts
LightBurnBaseElement.register("Shape.Rect", ShapeRect) // for shapes
// or
LightBurnBaseElement.register("LightBurnProject", LightBurnProject) // for normal tags
```

That’s it. If you follow the exact steps and paste the provided templates, you’ll have:

- A **reliable parser** that instantiates typed classes for all common LightBurn elements.
- A **clean registry** that keeps classes decoupled and discoverable.
- A working **SVG generator** that produces correct geometry and orientation (Y‑flip handled).
- Initial tests to prevent regressions and confirm round‑trip geometry.
