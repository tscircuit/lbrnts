import type { INode } from "svgson"
import { leaf } from "./node-helpers"

/**
 * Fill settings for hatch patterns
 */
export interface FillSettings {
  interval: number // Line spacing in mm
  angle: number // Fill angle in degrees
  crossHatch: boolean // Whether to add perpendicular lines
}

/**
 * Parameters for creating a hatch pattern
 */
export interface HatchPatternParams {
  interval: number
  angleDeg: number
  crossHatch: boolean
  color: string
  strokeWidth: number
  opacity?: number // Default: 0.8
}

/**
 * Generate a deterministic pattern ID from parameters.
 * Uses fixed decimal places for stable IDs across floating point values.
 * Handles all color formats (hex, named, rgb, rgba, hsl) by encoding
 * and sanitizing to produce valid XML IDs.
 */
function generatePatternId(params: HatchPatternParams): string {
  const opacity = params.opacity ?? 0.8
  // Encode color to handle all formats (hex, named, rgb, rgba, hsl),
  // then replace non-alphanumeric chars to ensure valid XML ID
  const safeColor = encodeURIComponent(params.color).replace(
    /[^a-zA-Z0-9]/g,
    "_",
  )
  return `hatch-${params.interval.toFixed(4)}-${params.angleDeg}-${params.crossHatch}-${safeColor}-${params.strokeWidth.toFixed(4)}-${opacity.toFixed(2)}`
}

/**
 * Create an SVG <pattern> element for hatch fill.
 *
 * The pattern uses patternUnits="userSpaceOnUse" and applies rotation
 * via patternTransform. The path extends beyond the cell boundaries
 * to ensure seamless tiling at any angle.
 */
export function createHatchPattern(params: HatchPatternParams): INode {
  const { interval, angleDeg, crossHatch, color, strokeWidth } = params
  const opacity = params.opacity ?? 0.8
  const id = generatePatternId(params)

  // Path extends beyond cell boundaries for seamless tiling.
  // We draw a horizontal line through the center of the cell,
  // extended to -interval...+interval to cover diagonal cases.
  let d = `M ${-interval} 0 L ${interval} 0`

  if (crossHatch) {
    // Add perpendicular (vertical) line for cross-hatching
    d += ` M 0 ${-interval} L 0 ${interval}`
  }

  return {
    name: "pattern",
    type: "element",
    value: "",
    attributes: {
      id,
      patternUnits: "userSpaceOnUse",
      width: String(interval),
      height: String(interval),
      patternTransform: `rotate(${angleDeg})`,
    },
    children: [
      leaf("path", {
        d,
        stroke: color,
        "stroke-width": String(strokeWidth),
        "stroke-opacity": String(opacity),
      }),
    ],
  }
}

/**
 * Registry for managing unique hatch patterns.
 *
 * Patterns are deduplicated by their parameter signature, ensuring
 * that identical hatch configurations share a single <pattern> definition.
 */
export class HatchPatternRegistry {
  private patterns = new Map<string, INode>()

  /**
   * Get or create a pattern for the given parameters.
   * @returns The pattern ID to use in fill="url(#id)"
   */
  getOrCreate(params: HatchPatternParams): string {
    const id = generatePatternId(params)
    if (!this.patterns.has(id)) {
      this.patterns.set(id, createHatchPattern(params))
    }
    return id
  }

  /**
   * Get all registered patterns for the <defs> section.
   */
  getPatterns(): INode[] {
    return Array.from(this.patterns.values())
  }

  /**
   * Check if any patterns have been registered.
   */
  hasPatterns(): boolean {
    return this.patterns.size > 0
  }
}

/**
 * Convert FillSettings to HatchPatternParams with render context.
 */
export function fillSettingsToPatternParams(
  settings: FillSettings,
  color: string,
  strokeWidth: number,
  opacity?: number,
): HatchPatternParams {
  return {
    interval: settings.interval,
    angleDeg: settings.angle,
    crossHatch: settings.crossHatch,
    color,
    strokeWidth,
    opacity,
  }
}
