import type { INode } from "svgson"
import { ShapeBase } from "../../classes/elements/shapes/ShapeBase"
import { ShapeEllipse } from "../../classes/elements/shapes/ShapeEllipse"
import { ShapeGroup } from "../../classes/elements/shapes/ShapeGroup"
import { ShapePath } from "../../classes/elements/shapes/ShapePath"
import { ShapeRect } from "../../classes/elements/shapes/ShapeRect"
import {
  arrayToMatrix,
  type BBox,
  boxUnion,
  emptyBox,
  identity,
  matToSvg,
  mul,
} from "../_math"
import { generateScanLines } from "../fill-patterns"
import { g, leaf } from "../node-helpers"
import { colorForCutIndex } from "../palette"
import {
  ellipseToPathData,
  rectToPathData,
  shapePathToPathData,
} from "../path-data"
import type { ShapeRenderer } from "./index"
import { bboxOfShape, svgForShape } from "./index"

/**
 * Check if a shape can be converted to path data for compound path rendering
 */
function isClosedPathShape(
  shape: ShapeBase,
): shape is ShapePath | ShapeRect | ShapeEllipse {
  if (shape instanceof ShapePath) {
    return shape.isClosed
  }
  if (shape instanceof ShapeRect || shape instanceof ShapeEllipse) {
    return true
  }
  return false
}

/**
 * Get path data for a shape, applying the group's transform
 */
function getPathDataForShape(
  shape: ShapeBase,
  groupMatrix: ReturnType<typeof identity>,
): string | null {
  if (shape instanceof ShapePath && shape.isClosed) {
    // For ShapePath, we need to combine the group transform with the shape's transform
    // The path data function already applies the shape's transform, so we need to
    // temporarily modify it to include the group transform
    const originalXform = shape.xform
    if (originalXform) {
      const shapeMatrix = arrayToMatrix(originalXform)
      const combinedMatrix = mul(groupMatrix, shapeMatrix)
      // Create a temporary xform array
      shape.xform = [
        combinedMatrix.a,
        combinedMatrix.b,
        combinedMatrix.c,
        combinedMatrix.d,
        combinedMatrix.e,
        combinedMatrix.f,
      ]
      const pathData = shapePathToPathData(shape)
      shape.xform = originalXform
      return pathData
    }
    // If no shape transform, apply just the group transform
    shape.xform = [
      groupMatrix.a,
      groupMatrix.b,
      groupMatrix.c,
      groupMatrix.d,
      groupMatrix.e,
      groupMatrix.f,
    ]
    const pathData = shapePathToPathData(shape)
    shape.xform = originalXform
    return pathData
  }
  if (shape instanceof ShapeRect) {
    const originalXform = shape.xform
    if (originalXform) {
      const shapeMatrix = arrayToMatrix(originalXform)
      const combinedMatrix = mul(groupMatrix, shapeMatrix)
      shape.xform = [
        combinedMatrix.a,
        combinedMatrix.b,
        combinedMatrix.c,
        combinedMatrix.d,
        combinedMatrix.e,
        combinedMatrix.f,
      ]
      const pathData = rectToPathData(shape)
      shape.xform = originalXform
      return pathData
    }
    shape.xform = [
      groupMatrix.a,
      groupMatrix.b,
      groupMatrix.c,
      groupMatrix.d,
      groupMatrix.e,
      groupMatrix.f,
    ]
    const pathData = rectToPathData(shape)
    shape.xform = originalXform
    return pathData
  }
  if (shape instanceof ShapeEllipse) {
    const originalXform = shape.xform
    if (originalXform) {
      const shapeMatrix = arrayToMatrix(originalXform)
      const combinedMatrix = mul(groupMatrix, shapeMatrix)
      shape.xform = [
        combinedMatrix.a,
        combinedMatrix.b,
        combinedMatrix.c,
        combinedMatrix.d,
        combinedMatrix.e,
        combinedMatrix.f,
      ]
      const pathData = ellipseToPathData(shape)
      shape.xform = originalXform
      return pathData
    }
    shape.xform = [
      groupMatrix.a,
      groupMatrix.b,
      groupMatrix.c,
      groupMatrix.d,
      groupMatrix.e,
      groupMatrix.f,
    ]
    const pathData = ellipseToPathData(shape)
    shape.xform = originalXform
    return pathData
  }
  return null
}

export const groupRenderer: ShapeRenderer<ShapeGroup> = {
  match: (s): s is ShapeGroup => s instanceof ShapeGroup,

  bbox: (grp): BBox => {
    // group itself has only xform; children's xform are already included when measuring each child
    return grp.children
      .filter((c): c is ShapeBase => c instanceof ShapeBase)
      .reduce((bb, c) => boxUnion(bb, bboxOfShape(c)), emptyBox())
  },

  toSvg: (grp, cutSettings, options): INode => {
    const groupMatrix = grp.xform ? arrayToMatrix(grp.xform) : identity()
    const transform = matToSvg(groupMatrix)

    const shapeChildren = grp.children.filter(
      (c): c is ShapeBase => c instanceof ShapeBase,
    )

    // Check if all children are closed path-convertible shapes (compound shape scenario)
    const allClosedPaths = shapeChildren.every((c) => isClosedPathShape(c))

    // If this is a compound shape (all closed paths), render as a single combined path
    // This enables proper hole rendering using the nonzero fill rule
    if (allClosedPaths && shapeChildren.length > 0) {
      // Combine all path data into a single compound path
      const pathDataParts: string[] = []
      for (const child of shapeChildren) {
        const pathData = getPathDataForShape(child, groupMatrix)
        if (pathData) {
          pathDataParts.push(pathData)
        }
      }

      if (pathDataParts.length > 0) {
        const combinedPathData = pathDataParts.join(" ")
        const children: INode[] = []

        // Get cut settings from first child to determine fill mode
        const firstChild = shapeChildren[0]!
        const cutIndex = firstChild.cutIndex
        const stroke = colorForCutIndex(cutIndex)
        const cutSetting =
          cutIndex !== undefined ? cutSettings.get(cutIndex) : undefined

        // Check if we should show fill (Scan or Scan+Cut modes)
        const shouldShowFill =
          cutSetting &&
          (cutSetting.type === "Scan" || cutSetting.type === "Scan+Cut")

        if (shouldShowFill && cutSetting) {
          // Calculate bounding box for scan lines
          const bbox = shapeChildren.reduce(
            (bb, c) => boxUnion(bb, bboxOfShape(c)),
            emptyBox(),
          )

          const fillSettings = {
            interval: cutSetting.interval || 0.1,
            angle: cutSetting.angle || 0,
            crossHatch: cutSetting.crossHatch || false,
          }

          const fillLines = generateScanLines(
            bbox,
            fillSettings,
            stroke,
            options.strokeWidth,
          )

          // Create a clip-path using the combined compound path with nonzero fill-rule
          const clipId = `clip-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

          const clipPath: INode = {
            name: "clipPath",
            type: "element",
            value: "",
            attributes: { id: clipId },
            children: [
              leaf("path", {
                d: combinedPathData,
                "fill-rule": "nonzero",
                "clip-rule": "nonzero",
              }),
            ],
          }

          const clippedGroup: INode = {
            name: "g",
            type: "element",
            value: "",
            attributes: { "clip-path": `url(#${clipId})` },
            children: fillLines,
          }

          children.push(clipPath)
          children.push(clippedGroup)
        }

        // Add the combined outline path with nonzero fill-rule
        children.push(
          leaf("path", {
            d: combinedPathData,
            fill: "none",
            "fill-rule": "nonzero",
            stroke,
            "stroke-width": String(options.strokeWidth),
          }),
        )

        // No transform needed - transforms are already baked into path data
        return g({}, children)
      }
    }

    // Fallback: render children individually (for mixed content groups)
    const children = shapeChildren.map((c) =>
      svgForShape(c, cutSettings, options),
    )
    return g({ transform }, children)
  },
}
