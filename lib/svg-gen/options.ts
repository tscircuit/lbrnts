export interface GenerateSvgOptions {
  margin?: number
  /** Target width for the SVG. When provided with height, scales the output. */
  width?: number
  /** Target height for the SVG. When provided with width, scales the output. */
  height?: number
  /** Default stroke width for shapes in mm. */
  defaultStrokeWidth?: number
}

export const DEFAULT_OPTIONS = {
  margin: 10,
  defaultStrokeWidth: 0.1,
} as const
