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

// LightBurn standard color palette
const LIGHTBURN_COLORS: Record<number, string> = {
  0: "#000000", // C00 - Black
  1: "#0000FF", // C01 - Blue
  2: "#FF0000", // C02 - Red
  3: "#00FF00", // C03 - Green
  4: "#FFFF00", // C04 - Yellow
  5: "#FF8000", // C05 - Orange
  6: "#00FFFF", // C06 - Cyan
  7: "#FF00FF", // C07 - Magenta
  8: "#C0C0C0", // C08 - Light Gray
  9: "#808080", // C09 - Gray
  10: "#800000", // C10 - Maroon
  11: "#008000", // C11 - Dark Green
  12: "#000080", // C12 - Navy
  13: "#808000", // C13 - Olive
  14: "#800080", // C14 - Purple
  15: "#008080", // C15 - Teal
  16: "#A0A0A0", // C16 - Gray
  17: "#8080C0", // C17 - Light Blue/Purple
  18: "#FFC0C0", // C18 - Light Pink
  19: "#0080FF", // C19 - Bright Blue
  20: "#FF0080", // C20 - Hot Pink/Magenta
  21: "#00FF80", // C21 - Spring Green
  22: "#FF8040", // C22 - Light Orange/Peach
  23: "#FFC0FF", // C23 - Light Magenta/Pink
  24: "#FF80C0", // C24 - Pink
}

function getColorForCutIndex(cutIndex: number | undefined): string {
  if (cutIndex === undefined) return "black"
  return LIGHTBURN_COLORS[cutIndex] || "black"
}

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
  const strokeColor = getColorForCutIndex(shape.cutIndex)

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
            stroke: strokeColor,
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
              stroke: strokeColor,
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
            stroke: strokeColor,
          },
          children: [],
        },
      ],
    }
  }

  if (shape instanceof ShapePath) {
    let d = ""

    // Process each primitive which describes the segment FROM vertex[i] TO vertex[i+1]
    for (let i = 0; i < shape.prims.length; i++) {
      const prim = shape.prims[i]!
      const startV = shape.verts[i]!
      const endV = shape.verts[(i + 1) % shape.verts.length]!

      if (i === 0) {
        // First vertex - move to start
        d += `M ${startV.x} ${startV.y}`
      }

      if (prim.type === 0) {
        // LineTo - straight line to next vertex
        d += ` L ${endV.x} ${endV.y}`
      } else if (prim.type === 1) {
        // BezierTo - curved line to next vertex using control points
        // Control points: c0 from start vertex (outgoing), c1 from end vertex (incoming)
        const c0x = startV.c0x ?? startV.x
        const c0y = startV.c0y ?? startV.y
        const c1x = endV.c1x ?? endV.x
        const c1y = endV.c1y ?? endV.y

        // Use cubic bezier for two control points
        d += ` C ${c0x} ${c0y} ${c1x} ${c1y} ${endV.x} ${endV.y}`
      }
    }

    // Close the path only if it's a closed path
    if (d.length > 0 && shape.isClosed) {
      d += " Z"
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
            stroke: strokeColor,
            "stroke-width": "0.1",
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
            fill: strokeColor,
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

  // LightBurn uses origin at (0, 0) at bottom-left
  // Extend the viewBox to include origin and all content with margin
  const viewBoxMinX = Math.min(0, bbox.minX) - margin
  const viewBoxMinY = Math.min(0, bbox.minY) - margin
  const viewBoxMaxX = Math.max(0, bbox.maxX) + margin
  const viewBoxMaxY = Math.max(0, bbox.maxY) + margin

  const width = viewBoxMaxX - viewBoxMinX
  const height = viewBoxMaxY - viewBoxMinY
  const viewBox = `${viewBoxMinX} ${viewBoxMinY} ${width} ${height}`

  // Calculate the Y-axis flip point for the entire viewBox
  const flipY = viewBoxMaxY + viewBoxMinY

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
      style: "background-color: white;",
    },
    children: [
      {
        name: "rect",
        type: "element",
        value: "",
        attributes: {
          x: String(viewBoxMinX),
          y: String(viewBoxMinY),
          width: String(width),
          height: String(height),
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
