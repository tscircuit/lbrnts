import { stringify } from "svgson"
import type { LightBurnBaseElement } from "../classes/LightBurnBaseElement"
import { collectShapes } from "./collect"
import { measure, renderAll } from "./registry"
import { computeLayout } from "./layout"
import { assembleSvg } from "./assemble"
import type { GenerateSvgOptions } from "./options"

export type { GenerateSvgOptions } from "./options"

export function generateLightBurnSvg(
  root: LightBurnBaseElement | LightBurnBaseElement[],
  options?: GenerateSvgOptions,
): string {
  const shapes = collectShapes(root)
  const bbox = measure(shapes)
  const layout = computeLayout(bbox, options)
  const nodes = renderAll(shapes)
  const svgTree = assembleSvg(nodes, layout)
  return stringify(svgTree)
}
