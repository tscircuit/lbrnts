import type { INode } from "svgson"
import { ShapePolygon } from "../../classes/elements/shapes/ShapePolygon"
import {
  addPts,
  apply,
  arrayToMatrix,
  type BBox,
  emptyBox,
  identity,
  matToSvg,
} from "../_math"
import { g, leaf } from "../node-helpers"
import { colorForCutIndex } from "../palette"
import type { ShapeRenderer } from "./index"

export const polygonVertices = (
  rx: number,
  ry: number,
  sides: number,
): Array<{ x: number; y: number }> => {
  const n = Math.max(3, Math.round(sides))
  const verts: Array<{ x: number; y: number }> = []
  for (let i = 0; i < n; i++) {
    const theta = -Math.PI / 2 + (2 * Math.PI * i) / n
    verts.push({
      x: rx * Math.cos(theta),
      y: ry * Math.sin(theta),
    })
  }
  return verts
}

export const polygonRenderer: ShapeRenderer<ShapePolygon> = {
  match: (s): s is ShapePolygon => s instanceof ShapePolygon,

  bbox: (el): BBox => {
    const rx = el.rx || 0
    const ry = el.ry || 0
    const xform = el.xform ? arrayToMatrix(el.xform) : identity()
    const extremes = [
      { x: rx, y: 0 },
      { x: -rx, y: 0 },
      { x: 0, y: ry },
      { x: 0, y: -ry },
    ]
    return addPts(
      emptyBox(),
      extremes.map((p) => apply(xform, p)),
    )
  },

  toSvg: (el): INode => {
    const xform = el.xform ? arrayToMatrix(el.xform) : identity()
    const transform = matToSvg(xform)
    const rx = el.rx || 0
    const ry = el.ry || 0
    const sides = el.n ?? 6
    const stroke = colorForCutIndex(el.cutIndex)
    const points = polygonVertices(rx, ry, sides)
      .map((p) => `${p.x},${p.y}`)
      .join(" ")

    return g({ transform }, [
      leaf("polygon", {
        points,
        fill: "none",
        stroke,
      }),
    ])
  },
}
