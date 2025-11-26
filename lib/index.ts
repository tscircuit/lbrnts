// Base classes
export * from "./classes/LightBurnBaseElement"

// Main project elements
export * from "./classes/elements/LightBurnProject"
export * from "./classes/elements/CutSetting"
export * from "./classes/elements/Notes"
export * from "./classes/elements/VariableText"
export * from "./classes/elements/UIPrefs"
export * from "./classes/elements/Thumbnail"

// Shape classes
export * from "./classes/elements/shapes/ShapeBase"
export * from "./classes/elements/shapes/ShapeEllipse"
export * from "./classes/elements/shapes/ShapeRect"
export * from "./classes/elements/shapes/ShapePath"
export * from "./classes/elements/shapes/ShapeText"
export * from "./classes/elements/shapes/ShapeGroup"
export * from "./classes/elements/shapes/ShapeBitmap"

// SVG generation
export * from "./svg-gen"
export { polygonToShapePathData } from "./polygon-to-shape-path-data"

// XML parsing utilities
export * from "./xml-parsing/parseXml"
