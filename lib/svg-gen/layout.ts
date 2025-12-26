import type { BBox } from "./_math"
import { DEFAULT_OPTIONS, type GenerateSvgOptions } from "./options"

export interface Layout {
  viewBox: string
  width: number
  height: number
  // matrix(1 0 0 -1 0 flipY) used for whole-scene flip
  flipY: number
  // background rect
  bg: { x: number; y: number; width: number; height: number }
}

export function computeLayout(
  bbox: BBox,
  options?: GenerateSvgOptions,
): Layout {
  const margin = options?.margin ?? DEFAULT_OPTIONS.margin

  // If bbox is empty (Infinity), substitute a default 100x100
  const isEmpty = bbox.minX === Infinity || bbox.maxX === -Infinity
  if (isEmpty) {
    bbox = { minX: 0, minY: 0, maxX: 100, maxY: 100 }
  }

  const minX = Math.min(0, bbox.minX) - margin
  const minY = Math.min(0, bbox.minY) - margin
  const maxX = Math.max(0, bbox.maxX) + margin
  const maxY = Math.max(0, bbox.maxY) + margin

  const contentWidth = maxX - minX
  const contentHeight = maxY - minY
  const viewBox = `${minX} ${minY} ${contentWidth} ${contentHeight}`
  const flipY = maxY + minY

  // Use provided dimensions if both are specified, otherwise use content size
  const width = options?.width ?? contentWidth
  const height = options?.height ?? contentHeight

  return {
    viewBox,
    width,
    height,
    flipY,
    bg: { x: minX, y: minY, width: contentWidth, height: contentHeight },
  }
}
