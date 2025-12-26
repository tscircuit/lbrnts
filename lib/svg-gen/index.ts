import { stringify } from "svgson"
import type { LightBurnBaseElement } from "../classes/LightBurnBaseElement"
import { assembleSvg } from "./assemble"
import { collectShapes } from "./collect"
import { collectCutSettings } from "./collect-cut-settings"
import { computeLayout } from "./layout"
import type { GenerateSvgOptions } from "./options"
import { measure, renderAll } from "./registry"

export type { GenerateSvgOptions } from "./options"

export function generateLightBurnSvg(
  root: LightBurnBaseElement | LightBurnBaseElement[],
  options?: GenerateSvgOptions,
): string {
  const shapes = collectShapes(root)
  const cutSettings = collectCutSettings(root)
  const bbox = measure(shapes)
  const layout = computeLayout(bbox, options)
  const nodes = renderAll(shapes, cutSettings, options)
  const svgTree = assembleSvg(nodes, layout)
  return stringify(svgTree)
}
