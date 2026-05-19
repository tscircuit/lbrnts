import { LightBurnBaseElement } from "./classes/LightBurnBaseElement"
import { LightBurnProject } from "./classes/elements/LightBurnProject"
import { ShapeBase, type Mat } from "./classes/elements/shapes/ShapeBase"

export interface ApplyOffsetToLbrnContentParams {
  lbrnContent: string
  xOffset: number
  yOffset: number
}

function assertFiniteOffset(name: string, value: number) {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
}

function parseProject(lbrnContent: string): LightBurnProject {
  const parsed = LightBurnBaseElement.parse(lbrnContent)
  if (!(parsed instanceof LightBurnProject)) {
    throw new Error("Expected a LightBurnProject XML document")
  }

  return parsed
}

function applyOffsetToShape(
  shape: ShapeBase,
  xOffset: number,
  yOffset: number,
) {
  const [a, b, c, d, tx, ty] = shape.xform
  shape.xform = [a, b, c, d, tx + xOffset, ty + yOffset] as Mat
}

export function applyOffsetToLbrnContent(
  params: ApplyOffsetToLbrnContentParams,
): string {
  const { lbrnContent, xOffset, yOffset } = params

  assertFiniteOffset("xOffset", xOffset)
  assertFiniteOffset("yOffset", yOffset)

  const project = parseProject(lbrnContent)

  for (const child of project.children) {
    if (child instanceof ShapeBase) {
      applyOffsetToShape(child, xOffset, yOffset)
    }
  }

  return project.getString()
}
