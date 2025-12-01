import { CutSetting } from "../classes/elements/CutSetting"
import { LightBurnProject } from "../classes/elements/LightBurnProject"
import type { LightBurnBaseElement } from "../classes/LightBurnBaseElement"

/**
 * Collect all CutSettings from a project or array of elements
 * Returns a Map of cutIndex -> CutSetting
 */
export function collectCutSettings(
  root: LightBurnBaseElement | LightBurnBaseElement[],
): Map<number, CutSetting> {
  const settings = new Map<number, CutSetting>()

  const processElement = (el: LightBurnBaseElement) => {
    if (el instanceof CutSetting && el.index !== undefined) {
      settings.set(el.index, el)
    } else if (el instanceof LightBurnProject) {
      for (const child of el.children) {
        if (child instanceof CutSetting && child.index !== undefined) {
          settings.set(child.index, child)
        }
      }
    }
  }

  if (Array.isArray(root)) {
    root.forEach(processElement)
  } else {
    processElement(root)
  }

  return settings
}
