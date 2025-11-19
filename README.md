# lbrnts

A type-safe library for parsing and writing [LightBurn](https://lightburnsoftware.com/) files.

## Installation

```bash
npm install lbrnts
```

## Usage

### Parsing Existing Projects

```tsx
import { LightBurnProject } from "lbrnts"

const project = LightBurnProject.parse(fs.readFileSync("project.lbrn2", "utf8"))

console.log(project.children)
```

### Creating Projects from Scratch

You can programmatically create LightBurn projects by constructing the project and its elements. Below is a table of all constructible classes with links to their documentation:

| Class | Description |
|-------|-------------|
| [LightBurnProject](#lightburnproject) | Root project container |
| [CutSetting](#cutsetting) | Cut/engrave settings (speed, power, etc.) |
| [ShapePath](#shapepath) | Custom paths with lines and bezier curves |
| [ShapeRect](#shaperect) | Rectangle shapes |
| [ShapeEllipse](#shapeellipse) | Ellipse/circle shapes |
| [ShapeText](#shapetext) | Text shapes |
| [ShapeBitmap](#shapebitmap) | Bitmap/image shapes |
| [ShapeGroup](#shapegroup) | Group container for shapes |
| [Notes](#notes) | Project notes |
| [VariableText](#variabletext) | Variable text settings |

## API Reference

### LightBurnProject

The root container for a LightBurn project.

#### Constructor

```typescript
new LightBurnProject(init?: {
  appVersion?: string
  formatVersion?: string
  materialHeight?: number
  mirrorX?: boolean
  mirrorY?: boolean
  children?: LightBurnBaseElement[]
})
```

#### Example

```typescript
import { LightBurnProject, CutSetting, ShapePath } from "lbrnts"

const cutSetting = new CutSetting({
  index: 0,
  name: "Wood Cut",
  priority: 0,
  type: "Cut",
  speed: 10,
  maxPower: 80,
  minPower: 60,
})

const path = new ShapePath({
  cutIndex: 0,
  verts: [
    { x: -25, y: -25 },
    { x: 25, y: -25 },
    { x: 25, y: 25 },
    { x: -25, y: 25 },
  ],
  prims: [
    { type: 0 },
    { type: 0 },
    { type: 0 },
    { type: 0 },
  ],
  isClosed: true,
})

const project = new LightBurnProject({
  appVersion: "1.7.03",
  formatVersion: "1",
  materialHeight: 0,
  children: [cutSetting, path],
})
```

#### Methods

- `getChildren()`: Returns the children array

---

### CutSetting

Defines cutting/engraving settings for laser operations.

#### Constructor

```typescript
new CutSetting(init?: {
  type?: string                // "Cut", "Scan", "Image", etc.
  index?: number               // Layer index
  name?: string                // Layer name
  priority?: number            // Execution priority
  minPower?: number           // Minimum power (0-100%)
  maxPower?: number           // Maximum power (0-100%)
  minPower2?: number          // Secondary laser minimum power
  maxPower2?: number          // Secondary laser maximum power
  speed?: number              // Speed in mm/s
  kerf?: number               // Kerf offset in mm
  zOffset?: number            // Z-axis offset
  enablePowerRamp?: boolean   // Enable power ramping
  rampLength?: number         // Ramp length in mm
  numPasses?: number          // Number of passes
  zPerPass?: number           // Z increment per pass
  perforate?: boolean         // Perforate mode
  dotMode?: boolean           // Dot mode
  scanOpt?: string            // Scan optimization
  interval?: number           // Scan line interval
  angle?: number              // Scan angle
  overScanning?: number       // Over-scanning distance
  lineAngle?: number          // Line angle for fill
})
```

#### Example

```typescript
const cutSetting = new CutSetting({
  index: 0,
  name: "Acrylic Engrave",
  priority: 1,
  type: "Cut",
  speed: 150,
  maxPower: 50,
  minPower: 40,
  numPasses: 3,
  enablePowerRamp: true,
  rampLength: 2,
})
```

---

### ShapePath

Custom paths with vertices and primitives (lines and bezier curves).

#### Constructor

```typescript
new ShapePath(init?: {
  verts?: Vert[]       // Array of vertices
  prims?: Prim[]       // Array of primitives (drawing commands)
  isClosed?: boolean   // Whether the path is closed
  cutIndex?: number    // Cut setting index to use
  locked?: boolean     // Lock the shape
  xform?: Mat          // Transformation matrix [a, b, c, d, tx, ty]
})

interface Vert {
  x: number
  y: number
  c?: number           // Control point flag
  c0x?: number         // Control point 0 x
  c0y?: number         // Control point 0 y
  c1x?: number         // Control point 1 x
  c1y?: number         // Control point 1 y
}

interface Prim {
  type: number         // 0 = LineTo, 1 = BezierTo
}

type Mat = [a: number, b: number, c: number, d: number, tx: number, ty: number]
```

#### Example: Simple Square

```typescript
const square = new ShapePath({
  cutIndex: 0,
  verts: [
    { x: -25, y: -25 },
    { x: 25, y: -25 },
    { x: 25, y: 25 },
    { x: -25, y: 25 },
  ],
  prims: [
    { type: 0 }, // LineTo
    { type: 0 }, // LineTo
    { type: 0 }, // LineTo
    { type: 0 }, // LineTo (close path)
  ],
  isClosed: true,
})
```

#### Example: Curved Path with Bezier Curves

```typescript
const curved = new ShapePath({
  cutIndex: 0,
  verts: [
    { x: 0, y: -30 },
    { x: 30, y: 0, c: 1, c0x: 30, c0y: -16.5, c1x: 30, c1y: -16.5 },
    { x: 0, y: 30, c: 1, c0x: 30, c0y: 16.5, c1x: 30, c1y: 16.5 },
    { x: -30, y: 0, c: 1, c0x: -30, c0y: 16.5, c1x: -30, c1y: 16.5 },
    { x: 0, y: -30, c: 1, c0x: -30, c0y: -16.5, c1x: -30, c1y: -16.5 },
  ],
  prims: [
    { type: 1 }, // BezierTo
    { type: 1 }, // BezierTo
    { type: 1 }, // BezierTo
    { type: 1 }, // BezierTo
  ],
  isClosed: true,
})
```

---

### ShapeRect

Rectangle shape (currently read-only from parsed files).

#### Constructor

```typescript
new ShapeRect()
```

#### Properties

- `w`: Width
- `h`: Height
- `cr`: Corner radius
- `cutIndex`: Cut setting index
- `locked`: Lock state
- `xform`: Transformation matrix

---

### ShapeEllipse

Ellipse/circle shape (currently read-only from parsed files).

#### Constructor

```typescript
new ShapeEllipse()
```

#### Properties

- `rx`: X radius
- `ry`: Y radius
- `cutIndex`: Cut setting index
- `locked`: Lock state
- `xform`: Transformation matrix

---

### ShapeText

Text shape (currently read-only from parsed files).

#### Constructor

```typescript
new ShapeText()
```

#### Properties

- `text`: Text content
- `font`: Font name
- `backupPath`: Backup path representation
- `cutIndex`: Cut setting index
- `locked`: Lock state
- `xform`: Transformation matrix

---

### ShapeBitmap

Bitmap/image shape (currently read-only from parsed files).

#### Constructor

```typescript
new ShapeBitmap()
```

#### Properties

- `w`: Width
- `h`: Height
- `dataBase64`: Base64-encoded image data
- `grayscale`: Grayscale mode
- `dpi`: DPI setting
- `ditherMode`: Dither mode
- `halftone`: Halftone mode
- `negative`: Negative mode
- `brightnessAdjust`: Brightness adjustment
- `contrastAdjust`: Contrast adjustment
- `gammaAdjust`: Gamma adjustment
- `cutIndex`: Cut setting index
- `locked`: Lock state
- `xform`: Transformation matrix

---

### ShapeGroup

Container for grouping shapes together (currently read-only from parsed files).

#### Constructor

```typescript
new ShapeGroup()
```

#### Properties

- `children`: Array of child shapes
- `cutIndex`: Cut setting index
- `locked`: Lock state
- `xform`: Transformation matrix

#### Methods

- `getChildren()`: Returns the children array

---

### Notes

Project notes that can be displayed when loading the project.

#### Constructor

```typescript
new Notes()
```

#### Properties

- `showOnLoad`: Whether to show notes on load
- `text`: Note text content

---

### VariableText

Variable text settings for dynamic text generation.

#### Constructor

```typescript
new VariableText()
```

#### Properties

- `start`: Start value
- `end`: End value
- `current`: Current value
- `increment`: Increment value
- `autoAdvance`: Auto-advance setting

---

## Generating SVG

You can generate SVG representations of your projects:

```typescript
import { generateLightBurnSvg } from "lbrnts"

const svg = generateLightBurnSvg(project)
```
