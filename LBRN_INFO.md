Below is a practical, developer‑oriented description of the **LightBurn project file formats**—legacy **`.lbrn`** and current **`.lbrn2`**—compiled from LightBurn’s documentation, forum discussions, and real project files in public repositories. I’ve emphasized structure, element semantics, and conventions you can rely on when designing a reader/writer that round‑trips cleanly. Where something is based on inference from real files rather than an official spec, I call it out as such and cite examples.

---

## What the formats are (and how they differ)

* LightBurn saves projects as either **`.lbrn`** (legacy) or **`.lbrn2`** (current default). Both store the **same project content**; `.lbrn2` was introduced for **smaller on‑disk size and faster loads** (~4× smaller, ~6× faster depending on content). Unless you must support very old LightBurn versions or prefer a more “verbose/human‑readable” file, use `.lbrn2`. ([LightBurn Documentation][1])

* In practice, **both formats are XML** (not a binary container). You can open them in a text editor. Files commonly start with a root element `<LightBurnProject ...>`. The legacy format uses `FormatVersion="0"`; `.lbrn2` uses `FormatVersion="1"`. (See the raw examples cited below.) ([FILExt][2])

---

## High‑level container

Each project file begins with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightBurnProject
  AppVersion="1.4.03"
  FormatVersion="1"           <!-- 0 for .lbrn, 1 for .lbrn2 -->
  MaterialHeight="0"
  MirrorX="False"
  MirrorY="False">
  ...
</LightBurnProject>
```

* **`AppVersion`** records the LightBurn version that wrote the file.
* **`FormatVersion`** distinguishes legacy `.lbrn` (`0`) vs `.lbrn2` (`1`). (Confirmed by public `.lbrn` / `.lbrn2` files.) ([GitHub][3])
* **`MirrorX` / `MirrorY`** indicate axis mirroring configured for the device/project. (Seen in numerous files.) ([GitHub][4])

> **Units.** LightBurn’s UI works in either inches or millimeters and auto‑converts; file values for geometry appear in **millimeters** (e.g., a 14″ square shows as W/H≈**355.6**). This is an inference from real project files plus LightBurn’s unit handling documentation. Your library should treat these as floating‑point **mm** values and convert for client APIs as needed. ([GitHub][5])

---

## Typical top‑level children (order varies)

You will commonly encounter these child elements under `<LightBurnProject>`:

### 1) `<Thumbnail>` (optional)

Embeds a **base64 PNG** preview:

```xml
<Thumbnail Source="iVBORw0KGgoAAAANSUhEUgAA..."/>
```

The `Source` attribute holds the PNG data (data URL not required; PNG bytes are base64). Useful to display a quick preview without parsing geometry. (Seen in multiple public `.lbrn2` files.) ([GitHub][5])

### 2) `<VariableText>` (optional)

Stores project‑level settings for LightBurn’s Variable Text feature:

```xml
<VariableText>
  <Start Value="0"/><End Value="999"/><Current Value="0"/>
  <Increment Value="1"/><AutoAdvance Value="0"/>
</VariableText>
```

Semantics (start/end/offset/increment/autoadvance) align with LightBurn’s Variable Text docs; shapes that contain Text can reference these settings. ([GitHub][5])

### 3) `<UIPrefs>` (optional)

A collection of editor/planner preferences, commonly a list of flags/parameters:

```xml
<UIPrefs>
  <Optimize_ByLayer Value="0"/>
  <Optimize_InnerToOuter Value="1"/>
  ...
</UIPrefs>
```

These preferences are *editor UI* and planner hints; they don’t affect geometry. (Visible in many `.lbrn2` examples.) ([GitHub][5])

### 4) One or more `<CutSetting>` elements (layers)

Each **layer** (including tool layers) is described as a `<CutSetting>` block. These are later **referenced by shapes** through a `CutIndex` attribute (details below).

```xml
<CutSetting type="Cut">
  <index    Value="2"/>
  <name     Value="C02"/>
  <speed    Value="8.33333"/>
  <maxPower Value="20"/>
  <maxPower2 Value="20"/>
  <priority Value="0"/>
  <doOutput Value="1"/>
</CutSetting>
```

* **`type`** is generally `"Cut"` for output layers; `"Tool"` for non‑output T1/T2 layers. Tool layers exist specifically for non‑output helpers (guides, jigs) and never produce laser output. ([GitHub][4])
* Common children include `index`, `name` (e.g., `"C01"`, `"C02"`, `"T1"`), `speed`, `maxPower`, `maxPower2`, `dotSpacing`, `priority`, `doOutput`. The **full set** depends on mode and device type (CO₂, diode, galvo), mirroring the **Cut Settings Editor** options (speed, power, passes, line interval, etc.). Your reader/writer should preserve unknown properties. ([GitHub][4])

> **Important:** “Cut Settings will only be saved to the file if the project is saved as `.lbrn`/`.lbrn2` and opened as a project (Open), not imported as artwork.” This is useful when validating round‑trip behavior. ([LightBurn Software Forum][6])

### 5) One or more `<Shape>` elements (geometry)

Most of the design is a flat sequence of `<Shape ...>` elements (groups can nest). The **shape type** is declared via `Type="..."` and the **layer link** via `CutIndex="..."`. Common attributes include **dimensions** and flags like `Locked`. Each shape has an `<XForm>` child holding its transform matrix. Example set:

```xml
<!-- Non-output tool rectangle (frame) -->
<Shape Type="Rect" CutIndex="30" Locked="1" W="355.60001" H="355.60001" Cr="0">
  <XForm>1 0 0 1 180.44348 172.88521</XForm>
</Shape>

<!-- Output rectangles on layer index 2 -->
<Shape Type="Rect" CutIndex="2" W="38.710007" H="57.169998" Cr="0">
  <XForm>1 0 0 1 89.992508 257</XForm>
</Shape>
```

* **Linking layer ↔ shape:** `CutIndex` references `<CutSetting><index Value="..."/>` (e.g., `CutIndex="2"` → the layer whose `<index Value="2"/>`). ([GitHub][4])
* **Rectangle** shapes use `W` (width), `H` (height), and optional `Cr` (corner radius). ([GitHub][4])
* **Other shape types** you will encounter (from public `.lbrn2` files and a parsing library):

  * `Ellipse` (circles/ellipses; uses radii/size attributes)
  * `Path` (arbitrary polylines/Bezier paths) with nested data (see below)
  * `Group` (container of nested shapes with its own `<XForm>`)
  * `Bitmap` (embedded raster image; carries `W`, `H`, **base64** pixel data and image options)
  * `Text` (text objects; often accompanied by a `<BackupPath>` used when converting text to outlines)
    These are covered directly (with examples) in the TypeScript project **`lbrn2-to-svg`**, which parses `.lbrn2` into a typed object model and converts to SVG. It documents: `Rect`, `Ellipse`, `Path` (with `<VertList>` and `<PrimList>` storing vertices and primitives), `Group`, `Bitmap` (`Data` base64), and `Text` (via `BackupPath`). ([GitHub][7])

#### The `<XForm>` matrix

Transform is a **2D affine** transform represented as six floats:

```
<XForm>a b c d tx ty</XForm>
```

Interpretation is standard SVG/canvas style:

```
| a c tx |
| b d ty |
| 0 0  1 |
```

* The **last two values** are translation (X, Y). This is mentioned explicitly in a LightBurn forum thread where users programmatically edit placement. ([LightBurn Software Forum][8])
* The 2×2 part encodes scale/rotation/shear. If you visualize shapes, note that **LightBurn’s coordinate system is Y‑up**, whereas SVG is Y‑down—`lbrn2-to-svg` handles that during conversion. Your own exporters will need a similar flip if targeting Y‑down systems. (This Y‑up detail is documented by that library.) ([GitHub][7])

> If you need a quick primer on affine matrices, the XFORM notes from Graphisoft’s GDL docs are a clean reference. ([GDL Center][9])

### 6) `<Notes>` (optional)

A simple note field:

```xml
<Notes ShowOnLoad="0" Notes="..."/>
```

Seen across many examples. ([GitHub][5])

---

## Layers and Tool layers (T1/T2)

* The **Cuts/Layers** panel in LightBurn corresponds to `<CutSetting>` entries. Normal layers are named `C01`… and **tool layers** are named **`T1`** and **`T2`**. Tool layers **have no cut parameters and never output**—they’re for guides, jigs, material boundaries, etc. In the file they appear as `<CutSetting type="Tool">` with names like `T1`, and shapes referencing them are “non‑output.” ([LightBurn Documentation][10])

---

## Paths and images (how they’re encoded)

While rectangles/ellipses are straightforward (attributes + `<XForm>`), **paths and bitmaps** use nested structures in `.lbrn2`:

* **`Path`** shapes carry geometry via a combination of:

  * `<VertList>` = a list of vertex records (coordinates and, for Beziers, control points named like `c0x/c0y/c1x/c1y`).
  * `<PrimList>` = a list of primitives (e.g., `L` = line, `B` = bezier) referencing vertices by index.
  * This pattern is documented (and exercised) by the open‑source `lbrn2-to-svg` parser. (There is no official public schema; this is an observed convention.) ([GitHub][7])

* **`Bitmap`** shapes encode image pixels as **base64** and include `W`/`H` and optional processing properties (gamma, contrast, etc.). The image is embedded, not linked, so projects remain self‑contained. (Again, see `lbrn2-to-svg` notes.) ([GitHub][7])

* **`Text`** shapes: many `.lbrn2` files include `Text` nodes that also carry a `BackupPath`—vector outlines of the text—which LightBurn uses for “Convert to Path.” A parser can use the backup path when you need pure vectors without implementing font layout. ([GitHub][7])

---

## Minimal real‑world examples on GitHub (useful for test fixtures)

Several public repositories contain tiny `.lbrn2` projects that you can load into a test suite to verify your reader/writer:

* A **very small `.lbrn2`** with a tool layer rectangle, optimization prefs, and a project thumbnail (shows overall tag shape and attribute conventions). ([GitHub][5])
* Another concise `.lbrn2` with multiple rectangles on a single cut layer. ([GitHub][4])
* A legacy **`.lbrn`** file (LightBurn 0.9.x) demonstrating `FormatVersion="0"` and the same general structure. (If the page is flaky, use the repo’s **Raw** view.) ([GitHub][11])

Additionally, a community TypeScript library **parses `.lbrn2`** and converts to SVG. Even if you’re not using TS, its readme enumerates the element types and how transforms and Y‑axis are handled—handy cross‑check for your own data model. ([GitHub][7])

---

## Suggested data model for your library

At minimum:

```text
Project {
  appVersion: string
  formatVersion: 0|1
  materialHeight: number
  mirrorX: boolean
  mirrorY: boolean
  thumbnail?: { pngBase64: string }
  variableText?: { start:number, end:number, current:number, increment:number, autoAdvance:boolean }
  uiPrefs?: Map<string, string|number|boolean>
  layers: Map<number, CutSetting>   // key = index
  shapes: Shape[]                   // may include groups (nesting)
  notes?: { showOnLoad:boolean, text:string }
}

CutSetting {
  index: number
  name: string    // 'C01', 'T1', etc.
  type: 'Cut' | 'Tool'
  params: Map<string, string|number|boolean> // speed, power, etc., preserved verbatim
}

Shape =
  Rect    { w,h, cr, cutIndex, locked?, xform }
| Ellipse { rx, ry, cutIndex, ... , xform }
| Path    { vertList, primList, cutIndex, xform }
| Group   { children: Shape[], cutIndex?, xform }    // groups can be unlayered or layer-inherited
| Bitmap  { w,h, dataBase64, imageProps..., xform }
| Text    { string, font?, style?, backupPath?, cutIndex, xform }

XForm { a,b,c,d, tx, ty }    // 6 floats
```

**Round‑trip safety tips**

* **Preserve unknown elements/attributes** (store them in `extra` maps and write them back untouched). This is vital because LightBurn’s set of per‑layer/shape properties is broad and device‑dependent. ([LightBurn Documentation][12])
* **Do not re‑order** shapes or layers unless you fully replicate LightBurn’s planner semantics.
* **Use mm internally** in your model for geometry; convert only at your public API boundary. (Matches what you see in real files.) ([GitHub][5])
* Handle **Y‑up ↔ Y‑down** if you export to SVG/PDF: you’ll need to flip Y or adjust transforms (see `lbrn2-to-svg`). ([GitHub][7])

---

## How to read/write effectively (implementation sketch)

1. **Parse the root and metadata** (`AppVersion`, `FormatVersion`, `MirrorX/Y`, `MaterialHeight`).
2. **Thumbnail**: if present, keep `Source` base64 intact; don’t transcode.
3. **VariableText**: parse `Start/End/Current/Increment/AutoAdvance` (`Value` attributes).
4. **UIPrefs**: treat as a map of `name → Value`.
5. **CutSetting (layers)**:

   * Read `type`, then parse all child elements into a `params` map.
   * *Key schema:* `index` (int) + `name` (e.g., `C01`, `T1`).
6. **Shapes**:

   * Read `Type`, `CutIndex`, optional flags/dimensions, and `<XForm>`.
   * For `Rect`: `W`, `H`, `Cr`.
   * For `Group`: recursively parse children.
   * For `Bitmap`: keep `Data` base64 intact and surface `W/H` and any image options.
   * For `Path`: parse `<VertList>` and `<PrimList>` as described by `lbrn2-to-svg`.
7. **Notes**: parse `ShowOnLoad` and `Notes`.

**Writing**: mirror the structure above. Maintain the original order where possible, retain unknown attributes, and emit the same `FormatVersion` you read unless the caller explicitly upgrades/downgrades.

---

## Minimal, working example files

I generated two tiny projects you can open in LightBurn to validate your parser and writer. They use only universally observed tags and attributes.

* **Download the legacy `.lbrn` example** – a single cut rectangle:
  **[minimal.lbrn](sandbox:/mnt/data/minimal.lbrn)**

* **Download the `.lbrn2` example** – a tool‑layer frame (T1) plus a cut rectangle:
  **[minimal.lbrn2](sandbox:/mnt/data/minimal.lbrn2)**

> These mirror the structure shown in public `.lbrn2` examples (thumbnail omitted to keep them small). If you open the `.lbrn2` example in LightBurn you should see a 100×100 tool frame (non‑output) and a 40×20 rounded rectangle placed at (30,30) on `C01`. (Tool layers are documented in LightBurn’s docs; see below.) ([GitHub][4])

---

## Gotchas & versioning notes

* **FormatVersion**: `0` (legacy `.lbrn`) vs `1` (`.lbrn2`). Don’t rely on `AppVersion` alone to detect file flavor. ([GitHub][3])
* **Opening vs importing**: Only **Open** restores layers/cut settings; **Import** brings in artwork without layer settings. This matters when you or your users validate round‑trips. ([LightBurn Documentation][13])
* **Backward compatibility**: Newer LightBurns read both; very old LightBurns may not understand `.lbrn2`. (Users are advised by LightBurn to prefer `.lbrn2` unless compatibility is needed.) ([LightBurn Documentation][1])
* **Coordinate system**: LightBurn projects are **Y‑up**; other platforms like SVG are **Y‑down**. Remember to invert appropriately if you export. ([GitHub][7])

---

## References (primary & “load‑bearing”)

**Official docs**

* File management & menu (formats supported; using **Open** for projects). ([LightBurn Documentation][1])
* Cuts / Layers window (layer semantics), Cut Settings Editor (speed/power, etc.). ([LightBurn Documentation][10])
* Tool layers (what T1/T2 are and why they never output). ([LightBurn Documentation][14])
* Variable Text (what those fields represent). ([LightBurn Documentation][15])
* Units/Dimensions, numeric entry with auto‑conversion. ([LightBurn Documentation][16])

**LightBurn forum (format insight from staff/users and examples)**

* `.lbrn2` vs `.lbrn`: why the new format; performance/size claims (from 0.9.21 notes). ([LightBurn Software Forum][17])
* Editing placement by changing `<XForm>` (translation last two values). ([LightBurn Software Forum][8])
* “Open vs Import” and layer settings persistence. ([LightBurn Software Forum][6])

**Public project files (structure by example)**

* Concise `.lbrn2` with `<Thumbnail>`, `<VariableText>`, `<UIPrefs>`, `<CutSetting>`, `<Shape>` (Rect + XForm), `<Notes>`. ([GitHub][5])
* Another `.lbrn2` with multiple `<Shape Type="Rect">` tied to a cut layer via `CutIndex`. ([GitHub][4])
* Example `.lbrn` (legacy; LightBurn 0.9.x) showing `FormatVersion="0"` and similar structure. ([GitHub][11])

**Open‑source parser (useful for schema inference)**

* `lbrn2-to-svg`: documents and implements parsing of `Rect`, `Ellipse`, `Path` (`VertList`/`PrimList`), `Group`, `Bitmap` (base64), `Text` (`BackupPath`); handles **Y‑up** to **Y‑down**. Great as a cross‑check when implementing your own parser. ([GitHub][7])

**General transform reference**

* Affine transform/XFORM primer (if you need a refresher). ([GDL Center][9])

**Format description pages (confirm XML nature)**

* File extension references describing `.lbrn` / `.lbrn2` as XML project files. (Use as secondary corroboration.) ([FILExt][2])

---

## What’s still *not* officially specified

LightBurn has not published a formal XSD/IDL for `.lbrn`/`.lbrn2`. The element and attribute names above are **stable by observation**, but **device‑specific** options (DSP vs GRBL vs galvo), and **new app versions** may add properties. **Your writer should preserve unknown children/attributes** it reads and write them back in their original order when possible (an approach often called “round‑trip fidelity”). ([LightBurn Documentation][12])

---

### Want more sample fixtures?

If you’d like, tell me what shapes or features you plan to support first (e.g., **Path** Beziers, **Bitmap** with thresholds/dither, **Text** outlines), and I can craft additional tiny `.lbrn2` fixtures that include those features and validate against LightBurn.

[1]: https://docs.lightburnsoftware.com/latest/Reference/FileManagement/?utm_source=chatgpt.com "File Management - LightBurn Documentation"
[2]: https://filext.com/file-extension/LBRN?utm_source=chatgpt.com "LBRN File Extension - What is it? How to open an LBRN file?"
[3]: https://github.com/MarcinZukowski/lightburn-tester/blob/master/examples/example2.lbrn?utm_source=chatgpt.com "lightburn-tester/examples/example2.lbrn at master - GitHub"
[4]: https://github.com/JTCozart/LightBurnTemplates/blob/main/ZippoLighter.lbrn2?utm_source=chatgpt.com "LightBurnTemplates/ZippoLighter.lbrn2 at main · JTCozart ... - GitHub"
[5]: https://github.com/JTCozart/LightBurnTemplates/blob/main/printable_area_jig.lbrn2?utm_source=chatgpt.com "LightBurnTemplates/printable_area_jig.lbrn2 at main - GitHub"
[6]: https://forum.lightburnsoftware.com/t/power-and-speed-settings-not-being-saved-when-i-save-the-file/128416?utm_source=chatgpt.com "Power and Speed settings not being saved when I save the file"
[7]: https://github.com/jlucaso1/lbrn2-to-svg "GitHub - jlucaso1/lbrn2-to-svg"
[8]: https://forum.lightburnsoftware.com/t/lbrn2-file-format-questions-origin-point/173782?utm_source=chatgpt.com "Lbrn2 File Format Questions - origin point? - LightBurn Software Forum"
[9]: https://gdl.graphisoft.com/tips-and-tricks/xform-the-transformation-matrix-and-applied-vector-geometry/?utm_source=chatgpt.com "XFORM: the transformation matrix | GRAPHISOFT GDL Center"
[10]: https://docs.lightburnsoftware.com/latest/Reference/CutsLayersWindow/?utm_source=chatgpt.com "Cuts / Layers Window - LightBurn Documentation"
[11]: https://github.com/tgfuellner/LaserStuff/blob/master/FussMatte-Muster.lbrn?utm_source=chatgpt.com "LaserStuff/FussMatte-Muster.lbrn at master - GitHub"
[12]: https://docs.lightburnsoftware.com/latest/Reference/CutSettingsEditor/?utm_source=chatgpt.com "Cut Settings Editor - LightBurn Documentation"
[13]: https://docs.lightburnsoftware.com/latest/Reference/UI/FileMenu/?utm_source=chatgpt.com "File Menu - LightBurn Documentation"
[14]: https://docs.lightburnsoftware.com/latest/Collections/MaterialUtilization/?utm_source=chatgpt.com "Material Utilization - LightBurn Documentation"
[15]: https://docs.lightburnsoftware.com/latest/Reference/VariableText/?utm_source=chatgpt.com "Variable Text - LightBurn Documentation"
[16]: https://docs.lightburnsoftware.com/latest/Reference/DeviceSettings/DimensionsUnits/?utm_source=chatgpt.com "Dimensions / Units - LightBurn Documentation"
[17]: https://forum.lightburnsoftware.com/t/file-type-lbrn-vs-lbrn2-what-is-difference/59699?utm_source=chatgpt.com "File type lbrn vs. lbrn2, what is difference? - LightBurn Software ..."

