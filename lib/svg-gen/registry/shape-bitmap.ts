import type { INode } from "svgson"
import { ShapeBitmap } from "../../classes/elements/shapes/ShapeBitmap"
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

  toSvg: (bmp, _cutSettings, _options): INode => {
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
