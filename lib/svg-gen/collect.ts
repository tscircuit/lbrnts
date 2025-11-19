import { LightBurnProject } from "../classes/elements/LightBurnProject"
import { ShapeBase } from "../classes/elements/shapes/ShapeBase"
import type { LightBurnBaseElement } from "../classes/LightBurnBaseElement"

export function collectShapes(
  root: LightBurnBaseElement | LightBurnBaseElement[],
): ShapeBase[] {
  const out: ShapeBase[] = []
  const pushFrom = (el: LightBurnBaseElement) => {
    if (el instanceof ShapeBase) {
      out.push(el)
    } else if (el instanceof LightBurnProject) {
      for (const c of el.children) {
        if (c instanceof ShapeBase) {
          out.push(c)
        }
      }
    }
  }
  Array.isArray(root) ? root.forEach(pushFrom) : pushFrom(root)
  return out
}
