import type { INode } from "svgson"
import { ShapeBase } from "../../classes/elements/shapes/ShapeBase"
import { ShapeGroup } from "../../classes/elements/shapes/ShapeGroup"
import {
  arrayToMatrix,
  type BBox,
  boxUnion,
  emptyBox,
  identity,
  matToSvg,
} from "../_math"
import { g } from "../node-helpers"
import type { RenderOptions, ShapeRenderer } from "./index"
import { bboxOfShape, svgForShape } from "./index"

export const groupRenderer: ShapeRenderer<ShapeGroup> = {
  match: (s): s is ShapeGroup => s instanceof ShapeGroup,

  bbox: (grp): BBox => {
    // group itself has only xform; children's xform are already included when measuring each child
    return grp.children
      .filter((c): c is ShapeBase => c instanceof ShapeBase)
      .reduce((bb, c) => boxUnion(bb, bboxOfShape(c)), emptyBox())
  },

  toSvg: (grp, cutSettings, options): INode => {
    const xform = grp.xform ? arrayToMatrix(grp.xform) : identity()
    const transform = matToSvg(xform)
    const children = grp.children
      .filter((c): c is ShapeBase => c instanceof ShapeBase)
      .map((c) => svgForShape(c, cutSettings, options))
    return g({ transform }, children)
  },
}
