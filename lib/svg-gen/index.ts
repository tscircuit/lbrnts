import { stringify } from "svgson"
import type { LightBurnBaseElement } from "../classes/LightBurnBaseElement"
import { assembleSvg } from "./assemble"
import { collectShapes } from "./collect"
import { computeLayout } from "./layout"
import { DEFAULT_OPTIONS, type GenerateSvgOptions } from "./options"
import { measure, renderAll } from "./registry"

export type { GenerateSvgOptions } from "./options"

export function generateLightBurnSvg(
  root: LightBurnBaseElement | LightBurnBaseElement[],
  options?: GenerateSvgOptions,
): string {
  const shapes = collectShapes(root)
  const bbox = measure(shapes)
  const layout = computeLayout(bbox, options)

  // Build render options
  const renderOptions = {
    strokeWidth:
      options?.defaultStrokeWidth ?? DEFAULT_OPTIONS.defaultStrokeWidth,
  }

  const nodes = renderAll(shapes, renderOptions)

  const svgTree = assembleSvg(nodes, layout, [])
  return stringify(svgTree)
}
