import type { INode } from "svgson"
import { stringify } from "svgson"
import { LightBurnProject } from "../classes/elements/LightBurnProject"
import { ShapeBase } from "../classes/elements/shapes/ShapeBase"
import { ShapeBitmap } from "../classes/elements/shapes/ShapeBitmap"
import { ShapeEllipse } from "../classes/elements/shapes/ShapeEllipse"
import { ShapeGroup } from "../classes/elements/shapes/ShapeGroup"
import { ShapePath } from "../classes/elements/shapes/ShapePath"
import { ShapeRect } from "../classes/elements/shapes/ShapeRect"
import { ShapeText } from "../classes/elements/shapes/ShapeText"
import type { LightBurnBaseElement } from "../classes/LightBurnBaseElement"
import {
  addPts,
  apply,
  arrayToMatrix,
  type BBox,
  boxUnion,
  emptyBox,
  identity,
  matToSvg,
} from "./_math"

function bboxOfShape(shape: ShapeBase): BBox {
  const identityMat = identity()
  const xform = shape.xform ? arrayToMatrix(shape.xform) : identityMat

  if (shape instanceof ShapeRect) {
    const w = shape.w || 0
    const h = shape.h || 0
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
  }

  if (shape instanceof ShapeEllipse) {
    const rx = shape.rx || 0
    const ry = shape.ry || 0
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
  }

  if (shape instanceof ShapeBitmap) {
    const w = shape.w || 0
    const h = shape.h || 0
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
  }

  if (shape instanceof ShapePath) {
    const pts = shape.verts.map((v) => apply(xform, { x: v.x, y: v.y }))
    return addPts(emptyBox(), pts)
  }

  if (shape instanceof ShapeText) {
    // Use backup path if available
    if (shape.backupPath) {
      const pts = shape.backupPath.verts.map((v) =>
        apply(xform, { x: v.x, y: v.y }),
      )
      return addPts(emptyBox(), pts)
    }
    // Fallback to a default size
    return addPts(emptyBox(), [
      apply(xform, { x: 0, y: 0 }),
      apply(xform, { x: 100, y: 50 }),
    ])
  }

  if (shape instanceof ShapeGroup) {
    let bb = emptyBox()
    for (const child of shape.children) {
      if (child instanceof ShapeBase) {
        bb = boxUnion(bb, bboxOfShape(child))
      }
    }
    return bb
  }

  return emptyBox()
}

function svgForShape(shape: ShapeBase): INode {
  const identityMat = identity()
  const xform = shape.xform ? arrayToMatrix(shape.xform) : identityMat
  const transform = matToSvg(xform)

  if (shape instanceof ShapeRect) {
    const w = shape.w || 0
    const h = shape.h || 0
    const cr = shape.cr || 0
    return {
      name: "g",
      type: "element",
      value: "",
      attributes: { transform },
      children: [
        {
          name: "rect",
          type: "element",
          value: "",
          attributes: {
            x: "0",
            y: "0",
            width: String(w),
            height: String(h),
            rx: String(cr),
            ry: String(cr),
            fill: "none",
            stroke: "black",
          },
          children: [],
        },
      ],
    }
  }

  if (shape instanceof ShapeEllipse) {
    const rx = shape.rx || 0
    const ry = shape.ry || 0
    if (rx === ry) {
      return {
        name: "g",
        type: "element",
        value: "",
        attributes: { transform },
        children: [
          {
            name: "circle",
            type: "element",
            value: "",
            attributes: {
              cx: "0",
              cy: "0",
              r: String(rx),
              fill: "none",
              stroke: "black",
            },
            children: [],
          },
        ],
      }
    }
    return {
      name: "g",
      type: "element",
      value: "",
      attributes: { transform },
      children: [
        {
          name: "ellipse",
          type: "element",
          value: "",
          attributes: {
            cx: "0",
            cy: "0",
            rx: String(rx),
            ry: String(ry),
            fill: "none",
            stroke: "black",
          },
          children: [],
        },
      ],
    }
  }

  if (shape instanceof ShapePath) {
    let d = ""
    let vertIdx = 0

    for (const prim of shape.prims) {
      const type = prim.type
      if (type === 0) {
        // LineTo
        if (vertIdx < shape.verts.length) {
          const v = shape.verts[vertIdx]!
          if (vertIdx === 0) {
            d += `M ${v.x} ${v.y}`
          } else {
            d += ` L ${v.x} ${v.y}`
          }
          vertIdx++
        }
      } else if (type === 1) {
        // BezierTo (quadratic or cubic)
        const v1 = shape.verts[vertIdx]
        const v2 = shape.verts[vertIdx + 1]
        if (v1 && v2) {
          d += ` Q ${v1.x} ${v1.y} ${v2.x} ${v2.y}`
          vertIdx += 2
        }
      }
    }

    return {
      name: "g",
      type: "element",
      value: "",
      attributes: { transform },
      children: [
        {
          name: "path",
          type: "element",
          value: "",
          attributes: {
            d,
            fill: "none",
            stroke: "black",
          },
          children: [],
        },
      ],
    }
  }

  if (shape instanceof ShapeBitmap) {
    const w = shape.w || 0
    const h = shape.h || 0
    const data = shape.dataBase64 || ""
    return {
      name: "g",
      type: "element",
      value: "",
      attributes: { transform },
      children: [
        {
          name: "image",
          type: "element",
          value: "",
          attributes: {
            href: `data:image/png;base64,${data}`,
            x: "0",
            y: "0",
            width: String(w),
            height: String(h),
          },
          children: [],
        },
      ],
    }
  }

  if (shape instanceof ShapeText) {
    const text = shape.text || ""
    return {
      name: "g",
      type: "element",
      value: "",
      attributes: { transform },
      children: [
        {
          name: "text",
          type: "element",
          value: "",
          attributes: {
            x: "0",
            y: "0",
            fill: "black",
          },
          children: [
            {
              name: "",
              type: "text",
              value: text,
              attributes: {},
              children: [],
            },
          ],
        },
      ],
    }
  }

  if (shape instanceof ShapeGroup) {
    const childNodes = shape.children
      .filter((c) => c instanceof ShapeBase)
      .map((c) => svgForShape(c as ShapeBase))
    return {
      name: "g",
      type: "element",
      value: "",
      attributes: { transform },
      children: childNodes,
    }
  }

  return {
    name: "g",
    type: "element",
    value: "",
    attributes: {},
    children: [],
  }
}

export interface GenerateSvgOptions {
  margin?: number
}

export function generateLightBurnSvg(
  root: LightBurnBaseElement | LightBurnBaseElement[],
  options?: GenerateSvgOptions,
): string {
  const margin = options?.margin ?? 10
  const shapes: ShapeBase[] = []

  // Collect shapes
  if (Array.isArray(root)) {
    for (const el of root) {
      if (el instanceof ShapeBase) {
        shapes.push(el)
      } else if (el instanceof LightBurnProject) {
        for (const child of el.children) {
          if (child instanceof ShapeBase) {
            shapes.push(child)
          }
        }
      }
    }
  } else if (root instanceof LightBurnProject) {
    for (const child of root.children) {
      if (child instanceof ShapeBase) {
        shapes.push(child)
      }
    }
  } else if (root instanceof ShapeBase) {
    shapes.push(root)
  }

  // Compute bounding box
  let bbox = emptyBox()
  for (const shape of shapes) {
    bbox = boxUnion(bbox, bboxOfShape(shape))
  }

  // Check if bbox is still empty (no valid shapes or all shapes have no geometry)
  const isEmptyBbox = bbox.minX === Infinity || bbox.maxX === -Infinity
  if (isEmptyBbox) {
    bbox = { minX: 0, minY: 0, maxX: 100, maxY: 100 }
  }

  const contentWidth = bbox.maxX - bbox.minX
  const contentHeight = bbox.maxY - bbox.minY

  // Apply margin to dimensions and viewBox
  const width = contentWidth + 2 * margin
  const height = contentHeight + 2 * margin
  const viewBoxMinX = bbox.minX - margin
  const viewBoxMinY = bbox.minY - margin
  const viewBox = `${viewBoxMinX} ${viewBoxMinY} ${width} ${height}`

  // Calculate the Y-axis flip point considering the viewBox offset
  const flipY = bbox.maxY + bbox.minY

  // Generate shape nodes
  const shapeNodes = shapes.map(svgForShape)

  // Build the SVG tree using svgson's INode structure
  const svgTree: INode = {
    name: "svg",
    type: "element",
    value: "",
    attributes: {
      xmlns: "http://www.w3.org/2000/svg",
      width: String(width),
      height: String(height),
      viewBox,
    },
    children: [
      {
        name: "rect",
        type: "element",
        value: "",
        attributes: {
          width: "100%",
          height: "100%",
          fill: "white",
        },
        children: [],
      },
      {
        name: "g",
        type: "element",
        value: "",
        attributes: {
          transform: `matrix(1 0 0 -1 0 ${flipY})`,
        },
        children: shapeNodes,
      },
    ],
  }

  return stringify(svgTree)
}
