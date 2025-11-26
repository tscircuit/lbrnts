// Import all element classes to trigger registration
import "./lib/classes/elements/LightBurnProject"
import "./lib/classes/elements/Thumbnail"
import "./lib/classes/elements/VariableText"
import "./lib/classes/elements/UIPrefs"
import "./lib/classes/elements/CutSetting"
import "./lib/classes/elements/Notes"
import "./lib/classes/elements/shapes/ShapeRect"
import "./lib/classes/elements/shapes/ShapeEllipse"
import "./lib/classes/elements/shapes/ShapePath"
import "./lib/classes/elements/shapes/ShapeGroup"
import "./lib/classes/elements/shapes/ShapeBitmap"
import "./lib/classes/elements/shapes/ShapeText"

export type { CutSettingInit } from "./lib/classes/elements/CutSetting"
export { CutSetting } from "./lib/classes/elements/CutSetting"
export type { LightBurnProjectInit } from "./lib/classes/elements/LightBurnProject"
export { LightBurnProject } from "./lib/classes/elements/LightBurnProject"
export { Notes } from "./lib/classes/elements/Notes"
export type { Mat } from "./lib/classes/elements/shapes/ShapeBase"
// Export shape classes
export { ShapeBase } from "./lib/classes/elements/shapes/ShapeBase"
export { ShapeBitmap } from "./lib/classes/elements/shapes/ShapeBitmap"
export { ShapeEllipse } from "./lib/classes/elements/shapes/ShapeEllipse"
export { ShapeGroup } from "./lib/classes/elements/shapes/ShapeGroup"
export type {
  Prim,
  ShapePathInit,
  Vert,
} from "./lib/classes/elements/shapes/ShapePath"
export { ShapePath } from "./lib/classes/elements/shapes/ShapePath"
export { ShapeRect } from "./lib/classes/elements/shapes/ShapeRect"
export { ShapeText } from "./lib/classes/elements/shapes/ShapeText"
export { Thumbnail } from "./lib/classes/elements/Thumbnail"
export { UIPrefs } from "./lib/classes/elements/UIPrefs"
export { VariableText } from "./lib/classes/elements/VariableText"
// Export main classes and functions
export { LightBurnBaseElement } from "./lib/classes/LightBurnBaseElement"
export type { GenerateSvgOptions } from "./lib/svg-gen/index"
// Export SVG generation
export { generateLightBurnSvg } from "./lib/svg-gen/index"
export type { ShapePathData } from "./lib/polygon-to-shape-path-data"
export { polygonToShapePathData } from "./lib/polygon-to-shape-path-data"
// Export types
export type {
  XmlJson,
  XmlJsonElement,
  XmlJsonValue,
} from "./lib/xml-parsing/xml-parsing-types"
