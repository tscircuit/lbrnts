export interface GenerateSvgOptions {
  margin?: number
  /** Target width for the SVG. When provided with height, scales the output. */
  width?: number
  /** Target height for the SVG. When provided with width, scales the output. */
  height?: number
}

export const DEFAULT_OPTIONS = {
  margin: 10,
} as const
