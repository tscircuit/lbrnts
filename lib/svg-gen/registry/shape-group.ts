import type { INode } from "svgson"
import { g } from "../node-helpers"
import {
  arrayToMatrix,
  boxUnion,
  emptyBox,
  identity,
  matToSvg,
  type BBox,
} from "../_math"
import { ShapeGroup } from "../../classes/elements/shapes/ShapeGroup"
import { ShapeBase } from "../../classes/elements/shapes/ShapeBase"
import { bboxOfShape, svgForShape } from "./index"
import type { ShapeRenderer } from "./index"

export const groupRenderer: ShapeRenderer<ShapeGroup> = {
  match: (s): s is ShapeGroup => s instanceof ShapeGroup,

  bbox: (grp): BBox => {
    // group itself has only xform; children's xform are already included when measuring each child
    return grp.children
      .filter((c): c is ShapeBase => c instanceof ShapeBase)
      .reduce((bb, c) => boxUnion(bb, bboxOfShape(c)), emptyBox())
  },

  toSvg: (grp): INode => {
    const xform = grp.xform ? arrayToMatrix(grp.xform) : identity()
    const transform = matToSvg(xform)
    const children = grp.children
      .filter((c): c is ShapeBase => c instanceof ShapeBase)
      .map(svgForShape)
    return g({ transform }, children)
  },
}
