import { LightBurnProject } from "./classes/elements/LightBurnProject"
import { ShapeBase, type Mat } from "./classes/elements/shapes/ShapeBase"

export interface ApplyOffsetToLbrnParams {
  lbrnProject: LightBurnProject
  xOffset: number
  yOffset: number
}

function assertFiniteOffset(name: string, value: number) {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
}

function applyOffsetToShape(
  shape: ShapeBase,
  xOffset: number,
  yOffset: number,
) {
  const [a, b, c, d, tx, ty] = shape.xform
  shape.xform = [a, b, c, d, tx + xOffset, ty + yOffset] as Mat
}

export function applyOffsetToLbrn(
  params: ApplyOffsetToLbrnParams,
): LightBurnProject {
  const { lbrnProject, xOffset, yOffset } = params

  assertFiniteOffset("xOffset", xOffset)
  assertFiniteOffset("yOffset", yOffset)

  for (const child of lbrnProject.children) {
    if (child instanceof ShapeBase) {
      applyOffsetToShape(child, xOffset, yOffset)
    }
  }

  return lbrnProject
}
