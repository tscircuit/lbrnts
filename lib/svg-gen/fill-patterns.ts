import type { INode } from "svgson"
import type { BBox } from "./_math"
import { leaf } from "./node-helpers"

export interface FillSettings {
  interval: number // Line spacing in mm
  angle: number // Fill angle in degrees
  crossHatch: boolean // Whether to add perpendicular lines
}

/**
 * Generate scan lines for filling a rectangular bounding box
 */
export function generateScanLines(
  bbox: BBox,
  settings: FillSettings,
  color: string,
  strokeWidth: number,
): INode[] {
  const lines: INode[] = []

  // Convert angle to radians
  const angleRad = (settings.angle * Math.PI) / 180

  // Generate primary fill lines
  const primaryLines = generateLinesAtAngle(
    bbox,
    settings.interval,
    angleRad,
    color,
    strokeWidth,
  )
  lines.push(...primaryLines)

  // Generate crosshatch if enabled
  if (settings.crossHatch) {
    const perpAngle = angleRad + Math.PI / 2
    const crossLines = generateLinesAtAngle(
      bbox,
      settings.interval,
      perpAngle,
      color,
      strokeWidth,
    )
    lines.push(...crossLines)
  }

  return lines
}

/**
 * Generate parallel lines at a given angle through a bounding box
 */
function generateLinesAtAngle(
  bbox: BBox,
  interval: number,
  angle: number,
  color: string,
  strokeWidth: number,
): INode[] {
  const lines: INode[] = []

  // Calculate the diagonal of the bbox to determine how many lines we need
  const diagonal = Math.sqrt(
    Math.pow(bbox.maxX - bbox.minX, 2) + Math.pow(bbox.maxY - bbox.minY, 2),
  )

  // Calculate direction vector for the fill lines
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)

  // Perpendicular vector for spacing between lines
  const px = -Math.sin(angle)
  const py = Math.cos(angle)

  // Center of the bbox
  const cx = (bbox.minX + bbox.maxX) / 2
  const cy = (bbox.minY + bbox.maxY) / 2

  // Number of lines needed (add extra to ensure full coverage)
  const numLines = Math.ceil(diagonal / interval) + 2

  // Generate lines
  for (let i = -numLines / 2; i <= numLines / 2; i++) {
    const offset = i * interval

    // Start point of the line (offset from center)
    const startX = cx + px * offset - dx * diagonal
    const startY = cy + py * offset - dy * diagonal

    // End point of the line
    const endX = cx + px * offset + dx * diagonal
    const endY = cy + py * offset + dy * diagonal

    // Clip line to bbox and add if it intersects
    const clipped = clipLineToBBox(
      startX,
      startY,
      endX,
      endY,
      bbox.minX,
      bbox.minY,
      bbox.maxX,
      bbox.maxY,
    )

    if (clipped) {
      lines.push(
        leaf("line", {
          x1: String(clipped.x1),
          y1: String(clipped.y1),
          x2: String(clipped.x2),
          y2: String(clipped.y2),
          stroke: color,
          "stroke-width": String(strokeWidth),
          "stroke-opacity": "0.8",
        }),
      )
    }
  }

  return lines
}

/**
 * Clip a line to a bounding box using Cohen-Sutherland algorithm
 */
function clipLineToBBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const INSIDE = 0
  const LEFT = 1
  const RIGHT = 2
  const BOTTOM = 4
  const TOP = 8

  function computeOutCode(x: number, y: number): number {
    let code = INSIDE
    if (x < minX) code |= LEFT
    else if (x > maxX) code |= RIGHT
    if (y < minY) code |= BOTTOM
    else if (y > maxY) code |= TOP
    return code
  }

  let outcode1 = computeOutCode(x1, y1)
  let outcode2 = computeOutCode(x2, y2)

  while (true) {
    if (!(outcode1 | outcode2)) {
      // Both points inside
      return { x1, y1, x2, y2 }
    } else if (outcode1 & outcode2) {
      // Both points outside on same side
      return null
    }

    // At least one point is outside
    const outcodeOut = outcode1 ? outcode1 : outcode2
    let x: number, y: number

    if (outcodeOut & TOP) {
      x = x1 + ((x2 - x1) * (maxY - y1)) / (y2 - y1)
      y = maxY
    } else if (outcodeOut & BOTTOM) {
      x = x1 + ((x2 - x1) * (minY - y1)) / (y2 - y1)
      y = minY
    } else if (outcodeOut & RIGHT) {
      y = y1 + ((y2 - y1) * (maxX - x1)) / (x2 - x1)
      x = maxX
    } else {
      y = y1 + ((y2 - y1) * (minX - x1)) / (x2 - x1)
      x = minX
    }

    if (outcodeOut === outcode1) {
      x1 = x
      y1 = y
      outcode1 = computeOutCode(x1, y1)
    } else {
      x2 = x
      y2 = y
      outcode2 = computeOutCode(x2, y2)
    }
  }
}
