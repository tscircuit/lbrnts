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

// Export main classes and functions
export { LightBurnBaseElement } from "./lib/classes/LightBurnBaseElement"
export { LightBurnProject } from "./lib/classes/elements/LightBurnProject"
export { Thumbnail } from "./lib/classes/elements/Thumbnail"
export { VariableText } from "./lib/classes/elements/VariableText"
export { UIPrefs } from "./lib/classes/elements/UIPrefs"
export { CutSetting } from "./lib/classes/elements/CutSetting"
export { Notes } from "./lib/classes/elements/Notes"

// Export shape classes
export { ShapeBase } from "./lib/classes/elements/shapes/ShapeBase"
export { ShapeRect } from "./lib/classes/elements/shapes/ShapeRect"
export { ShapeEllipse } from "./lib/classes/elements/shapes/ShapeEllipse"
export { ShapePath } from "./lib/classes/elements/shapes/ShapePath"
export { ShapeGroup } from "./lib/classes/elements/shapes/ShapeGroup"
export { ShapeBitmap } from "./lib/classes/elements/shapes/ShapeBitmap"
export { ShapeText } from "./lib/classes/elements/shapes/ShapeText"

// Export SVG generation
export { generateLightBurnSvg } from "./lib/svg-gen/generateLightBurnSvg"

// Export types
export type { XmlJson, XmlJsonElement, XmlJsonValue } from "./lib/xml-parsing/xml-parsing-types"
export type { Mat } from "./lib/classes/elements/shapes/ShapeBase"
export type { Vert, Prim } from "./lib/classes/elements/shapes/ShapePath"
