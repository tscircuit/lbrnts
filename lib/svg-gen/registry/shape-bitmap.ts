import type { INode } from "svgson"
import { g, leaf } from "../node-helpers"
import {
  addPts,
  apply,
  arrayToMatrix,
  emptyBox,
  identity,
  matToSvg,
  type BBox,
} from "../_math"
import { ShapeBitmap } from "../../classes/elements/shapes/ShapeBitmap"
import type { ShapeRenderer } from "./index"

export const bitmapRenderer: ShapeRenderer<ShapeBitmap> = {
  match: (s): s is ShapeBitmap => s instanceof ShapeBitmap,

  bbox: (bmp): BBox => {
    const w = bmp.w || 0
    const h = bmp.h || 0
    const xform = bmp.xform ? arrayToMatrix(bmp.xform) : identity()
    const corners = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ]
    return addPts(
      emptyBox(),
      corners.map((p) => apply(xform, p)),
    )
  },

  toSvg: (bmp): INode => {
    const xform = bmp.xform ? arrayToMatrix(bmp.xform) : identity()
    const transform = matToSvg(xform)
    const w = bmp.w || 0
    const h = bmp.h || 0
    const data = bmp.dataBase64 || ""
    return g({ transform }, [
      leaf("image", {
        href: `data:image/png;base64,${data}`,
        x: "0",
        y: "0",
        width: String(w),
        height: String(h),
      }),
    ])
  },
}
