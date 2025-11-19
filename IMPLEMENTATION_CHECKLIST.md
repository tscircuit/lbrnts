Here’s a focused implementation checklist you can work through step-by-step.

---

## 1. Repo & Foundation

- [ ] Rename or alias `BaseLightBurnElement` → **`LightBurnBaseElement`**

  - [ ] Ensure the file is `lib/classes/LightBurnBaseElement.ts`
  - [ ] Export `LightBurnBaseElement`
  - [ ] (Optional) Re-export `BaseLightBurnElement` for backward compatibility

- [ ] Fix import paths

  - [ ] In `LightBurnBaseElement.ts`, update XML import to `../xml-parsing/parseXml`
  - [ ] Ensure all other class files use correct relative paths

- [ ] Decide XML parser strategy

  - [ ] **Option chosen:** make `parseXml` synchronous (e.g., using `fast-xml-parser`)
  - [ ] Add dependency in `package.json` (`fast-xml-parser` or equivalent)

---

## 2. XML Parsing Layer

- [ ] Implement `parseXml` in `lib/xml-parsing/parseXml.ts`

  - [ ] Use `fast-xml-parser` (or your chosen lib)
  - [ ] Parse XML into plain JS objects synchronously
  - [ ] Normalize attributes into the `XmlJsonElement` shape:

    - [ ] Attributes → `node.$`
    - [ ] Text content → `node._`

  - [ ] Return an object shaped as `XmlJson` (single root key → `XmlJsonElement`)

- [ ] Confirm `xml-parsing-types.ts` still matches parsed structure (or adjust if needed)

---

## 3. Base Element & Registry

- [ ] Implement `LightBurnBaseElement` core

  - [ ] Abstract `token: string` on instance
  - [ ] Static `token: string` on class
  - [ ] Implement `getChildren`, `getString`, `getStringIndented`, and `inspect` helpers

- [ ] Implement registration system

  - [ ] `static register(token: string, klass: any)`
  - [ ] Maintain:

    - [ ] `elementRegistry` for tag names (`"LightBurnProject"`, `"CutSetting"`, `"Notes"`, etc.)
    - [ ] `shapeRegistry` for shapes (`"Shape.Rect"`, `"Shape.Path"`, etc.)

  - [ ] Store `"Shape.*"` tokens in `shapeRegistry`, others in `elementRegistry`

- [ ] Implement parse entrypoints

  - [ ] `static parse(xml: string): LightBurnBaseElement | LightBurnBaseElement[]`

    - [ ] Calls `parseXml(xml)`
    - [ ] Delegates to `parseXmlJson`

  - [ ] `static parseXmlJson(xmlJson: XmlJsonValue): any`

    - [ ] Handle root object `{ RootTag: Element }`
    - [ ] Arrays → map recursively
    - [ ] Use factory to instantiate registered classes

- [ ] Implement factory method

  - [ ] `instantiateElement(tag: string, node: XmlJsonElement): any`

    - [ ] Look up tag in `elementRegistry`
    - [ ] Special handling for `tag === "Shape"`:

      - [ ] Read `Type` attribute
      - [ ] Compose `"Shape.<Type>"` token
      - [ ] Look up in `shapeRegistry`

    - [ ] Fallback to `UnknownElement` if no class found

- [ ] Implement `UnknownElement`

  - [ ] Stores original `tag` and raw `XmlJsonElement`
  - [ ] Registered with `LightBurnBaseElement.register("Unknown", UnknownElement)`

---

## 4. Shared Helpers

- [ ] Create coercion helpers in `lib/classes/elements/_coerce.ts`

  - [ ] `num(v, default)`
  - [ ] `boolish(v, default)`
  - [ ] `str(v, default)`

---

## 5. Core Element Classes

Create each in `lib/classes/elements/` and **end with `LightBurnBaseElement.register(...)`**.

### 5.1 LightBurnProject

- [ ] Implement `LightBurnProject`

  - [ ] Fields: `appVersion`, `formatVersion`, `materialHeight`, `mirrorX`, `mirrorY`, `children`
  - [ ] `fromXmlJson(node)`:

    - [ ] Read root attributes from `node.$`
    - [ ] Instantiate known children: `Thumbnail`, `VariableText`, `UIPrefs`, `CutSetting`, `Shape`, `Notes`
    - [ ] Use base factory for each child tag

  - [ ] `getChildren()` returns `children`
  - [ ] Register:
        `LightBurnBaseElement.register("LightBurnProject", LightBurnProject)`

### 5.2 Thumbnail

- [ ] Implement `Thumbnail`

  - [ ] Field: `pngBase64` from `Source` attribute
  - [ ] Register: `LightBurnBaseElement.register("Thumbnail", Thumbnail)`

### 5.3 VariableText

- [ ] Implement `VariableText`

  - [ ] Fields: `start`, `end`, `current`, `increment`, `autoAdvance`
  - [ ] Parse children like `<Start Value="..."/>` via `node.Start.$.Value`
  - [ ] Register: `LightBurnBaseElement.register("VariableText", VariableText)`

### 5.4 UIPrefs

- [ ] Implement `UIPrefs`

  - [ ] Field: `prefs: Record<string, string>`
  - [ ] Iterate over node keys (excluding `$` and `_`) and read `$ .Value`
  - [ ] Register: `LightBurnBaseElement.register("UIPrefs", UIPrefs)`

### 5.5 CutSetting

- [ ] Implement `CutSetting`

  - [ ] Fields: `type`, `index`, `name`, `params`
  - [ ] `type` from `node.$.type` (default `"Cut"`)
  - [ ] Children: `index`, `name`, plus others into `params`
  - [ ] Register: `LightBurnBaseElement.register("CutSetting", CutSetting)`

### 5.6 Notes

- [ ] Implement `Notes`

  - [ ] Fields: `showOnLoad`, `text`
  - [ ] From attributes `ShowOnLoad`, `Notes`
  - [ ] Register: `LightBurnBaseElement.register("Notes", Notes)`

---

## 6. Shape Subsystem

Create in `lib/classes/elements/shapes/` and register as `"Shape.<Type>"`.

### 6.1 ShapeBase

- [ ] Implement `ShapeBase` (abstract)

  - [ ] Extends `LightBurnBaseElement`
  - [ ] Common fields: `cutIndex`, `locked`, `xform: [a,b,c,d,tx,ty]`
  - [ ] Static helper `readCommon(node)`:

    - [ ] Read `CutIndex`, `Locked` from attributes
    - [ ] Parse `<XForm>` text into `[a,b,c,d,tx,ty]`

### 6.2 ShapeRect

- [ ] Implement `ShapeRect`

  - [ ] Extends `ShapeBase`
  - [ ] Fields: `w`, `h`, `cr`
  - [ ] `fromXmlJson`: read `W`, `H`, `Cr`
  - [ ] Register: `LightBurnBaseElement.register("Shape.Rect", ShapeRect)`

### 6.3 ShapeEllipse

- [ ] Implement `ShapeEllipse`

  - [ ] Extends `ShapeBase`
  - [ ] Fields: `rx`, `ry`
  - [ ] `fromXmlJson`: read `Rx`/`Ry` (or equivalent)
  - [ ] Register: `LightBurnBaseElement.register("Shape.Ellipse", ShapeEllipse)`

### 6.4 ShapePath

- [ ] Implement `ShapePath`

  - [ ] Extends `ShapeBase`
  - [ ] Fields: `verts`, `prims`
  - [ ] Parse `<VertList><Vert .../></VertList>`
  - [ ] Parse `<PrimList><Prim .../></PrimList>`
  - [ ] Register: `LightBurnBaseElement.register("Shape.Path", ShapePath)`

### 6.5 ShapeGroup

- [ ] Implement `ShapeGroup`

  - [ ] Extends `ShapeBase`
  - [ ] Field: `children: LightBurnBaseElement[]`
  - [ ] Parse nested `<Shape>` children via base factory
  - [ ] Override `getChildren()` to return `children`
  - [ ] Register: `LightBurnBaseElement.register("Shape.Group", ShapeGroup)`

### 6.6 ShapeBitmap

- [ ] Implement `ShapeBitmap`

  - [ ] Extends `ShapeBase`
  - [ ] Fields: `w`, `h`, `dataBase64`, `props`
  - [ ] `W`, `H` from attributes; `Data.Source` as base64
  - [ ] Additional children → `props` map
  - [ ] Register: `LightBurnBaseElement.register("Shape.Bitmap", ShapeBitmap)`

### 6.7 ShapeText

- [ ] Implement `ShapeText`

  - [ ] Extends `ShapeBase`
  - [ ] Fields: `text`, `font?`, `backupPath?`
  - [ ] Read `Text`, `Font` attributes
  - [ ] Optionally parse `BackupPath` as a `ShapePath`
  - [ ] Register: `LightBurnBaseElement.register("Shape.Text", ShapeText)`

---

## 7. SVG Generator

**File**: `lib/svg-gen/generateLightBurnSvg.ts`

### 7.1 Math helpers

- [ ] Create `_math.ts`

  - [ ] Type `Mat = [a,b,c,d,tx,ty]`, `Pt = {x,y}`
  - [ ] `apply(m, p)` → transformed point
  - [ ] `mul(a, b)` → matrix multiplication (if needed later)
  - [ ] `matToSvg(m)` → `matrix(a b c d tx ty)`

### 7.2 Bounding boxes

- [ ] Implement `BBox` helpers

  - [ ] `emptyBox()`
  - [ ] `boxUnion(a,b)`
  - [ ] `addPts(bb, pts)` to expand bbox

- [ ] Implement `bboxOfShape(s: ShapeBase): BBox`

  - [ ] `ShapeRect`: transform 4 corners
  - [ ] `ShapeEllipse`: transform 4 extreme points
  - [ ] `ShapeBitmap`: transform 4 corners
  - [ ] `ShapePath`: transform all vertices
  - [ ] `ShapeGroup`: union of child bboxes

### 7.3 Shape → SVG converters

- [ ] Implement `svgForShape(s: ShapeBase): string`

  - [ ] Read `s.xform` and convert to `transform="matrix(...)"` on an inner `<g>`
  - [ ] Rect → `<rect>` with `x=0,y=0,width=W,height=H,rx=Cr,ry=Cr`
  - [ ] Ellipse → `<circle>` or `<ellipse>` depending on rx/ry
  - [ ] Path → build `d` from `verts` and `prims`
  - [ ] Bitmap → `<image href="data:image/png;base64,...">`
  - [ ] Text → `<text>` (or fallback to backup path later)
  - [ ] Escape text using an `escapeXml` helper

### 7.4 Root SVG wrapper & Y-flip

- [ ] Implement `generateLightBurnSvg(root: LightBurnBaseElement): string`

  - [ ] Collect shapes:

    - [ ] If `root` is `LightBurnProject`, collect `ShapeBase` children
    - [ ] If `root` is a `ShapeBase`, just that
    - [ ] If `root` is array, collect all `ShapeBase`

  - [ ] Compute union bbox of all shapes
  - [ ] Determine `width` and `height` (fallback like 100×100 if empty)
  - [ ] Build root `<svg>` with:

    - [ ] `xmlns="http://www.w3.org/2000/svg"`
    - [ ] `width`, `height`, and `viewBox`

  - [ ] Add top-level `<g transform="matrix(1 0 0 -1 0 height)">` for Y-flip
  - [ ] Insert shape SVG strings inside that `<g>`

---

## 8. Public API Exports

- [ ] Update `index.ts`

  - [ ] Export `LightBurnBaseElement`
  - [ ] Export `LightBurnProject`
  - [ ] Export shape types (optional)
  - [ ] Export `generateLightBurnSvg`

---

## 9. Tests

### 9.1 Parsing + SVG snapshot

- [ ] Add `tests/project-to-svg.test.ts`

  - [ ] Include minimal `.lbrn2` sample with a `<Shape Type="Rect">`
  - [ ] Parse via `LightBurnBaseElement.parse`
  - [ ] Generate SVG via `generateLightBurnSvg`
  - [ ] Snapshot via `toMatchSvgSnapshot`

### 9.2 Additional cases

- [ ] Path test

  - [ ] Minimal VertList/PrimList example
  - [ ] Assert `<path>` appears, and `d` is sane

- [ ] Group test

  - [ ] Project with a `<Shape Type="Group">` and nested shapes
  - [ ] Ensure grouped shapes render properly in SVG

- [ ] Bitmap test

  - [ ] Project with a `<Shape Type="Bitmap">`
  - [ ] Ensure `<image href="data:image/png;base64,...">` appears

---

## 10. Polish & Extras (optional)

- [ ] Map `CutSetting` → SVG styling (stroke, colors, etc.)
- [ ] Add writer API (`toXml()` / `serializeProject()`)
- [ ] Add CLI (`lbrn2svg`) that reads a file and writes SVG to stdout
- [ ] Add documentation to `README.md` for:

  - [ ] Parsing LightBurn files
  - [ ] Generating SVG
  - [ ] Supported shapes and known limitations

---

If you want, I can turn this checklist into a GitHub issue / PR template-style markdown that you can drop directly into your repo.
