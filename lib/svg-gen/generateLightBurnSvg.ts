import { LightBurnBaseElement } from "../classes/LightBurnBaseElement"
import { LightBurnProject } from "../classes/elements/LightBurnProject"
import { ShapeBase } from "../classes/elements/shapes/ShapeBase"
import { ShapeRect } from "../classes/elements/shapes/ShapeRect"
import { ShapeEllipse } from "../classes/elements/shapes/ShapeEllipse"
import { ShapePath } from "../classes/elements/shapes/ShapePath"
import { ShapeGroup } from "../classes/elements/shapes/ShapeGroup"
import { ShapeBitmap } from "../classes/elements/shapes/ShapeBitmap"
import { ShapeText } from "../classes/elements/shapes/ShapeText"
import { apply, matToSvg, emptyBox, boxUnion, addPts, type BBox, type Mat } from "./_math"

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function bboxOfShape(shape: ShapeBase): BBox {
  const identity: Mat = [1, 0, 0, 1, 0, 0]
  const xform = shape.xform || identity

  if (shape instanceof ShapeRect) {
    const w = shape.w || 0
    const h = shape.h || 0
    const corners = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ]
    return addPts(emptyBox(), corners.map((p) => apply(xform, p)))
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
    return addPts(emptyBox(), extremes.map((p) => apply(xform, p)))
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
    return addPts(emptyBox(), corners.map((p) => apply(xform, p)))
  }

  if (shape instanceof ShapePath) {
    const pts = shape.verts.map((v) => apply(xform, { x: v.x, y: v.y }))
    return addPts(emptyBox(), pts)
  }

  if (shape instanceof ShapeText) {
    // Use backup path if available
    if (shape.backupPath) {
      const pts = shape.backupPath.verts.map((v) => apply(xform, { x: v.x, y: v.y }))
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

function svgForShape(shape: ShapeBase): string {
  const identity: Mat = [1, 0, 0, 1, 0, 0]
  const xform = shape.xform || identity
  const transformAttr = `transform="${matToSvg(xform)}"`

  if (shape instanceof ShapeRect) {
    const w = shape.w || 0
    const h = shape.h || 0
    const cr = shape.cr || 0
    return `<g ${transformAttr}>
  <rect x="0" y="0" width="${w}" height="${h}" rx="${cr}" ry="${cr}" fill="none" stroke="black" />
</g>`
  }

  if (shape instanceof ShapeEllipse) {
    const rx = shape.rx || 0
    const ry = shape.ry || 0
    if (rx === ry) {
      return `<g ${transformAttr}>
  <circle cx="0" cy="0" r="${rx}" fill="none" stroke="black" />
</g>`
    }
    return `<g ${transformAttr}>
  <ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="none" stroke="black" />
</g>`
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

    return `<g ${transformAttr}>
  <path d="${d}" fill="none" stroke="black" />
</g>`
  }

  if (shape instanceof ShapeBitmap) {
    const w = shape.w || 0
    const h = shape.h || 0
    const data = shape.dataBase64 || ""
    return `<g ${transformAttr}>
  <image href="data:image/png;base64,${data}" x="0" y="0" width="${w}" height="${h}" />
</g>`
  }

  if (shape instanceof ShapeText) {
    const text = escapeXml(shape.text || "")
    return `<g ${transformAttr}>
  <text x="0" y="0" fill="black">${text}</text>
</g>`
  }

  if (shape instanceof ShapeGroup) {
    const childSvgs = shape.children
      .filter((c) => c instanceof ShapeBase)
      .map((c) => svgForShape(c as ShapeBase))
      .join("\n")
    return `<g ${transformAttr}>
${childSvgs}
</g>`
  }

  return ""
}

export interface GenerateSvgOptions {
  margin?: number
}

export function generateLightBurnSvg(
  root: LightBurnBaseElement | LightBurnBaseElement[],
  options?: GenerateSvgOptions
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

  const contentWidth = bbox.maxX - bbox.minX || 100
  const contentHeight = bbox.maxY - bbox.minY || 100

  // Apply margin to dimensions and viewBox
  const width = contentWidth + 2 * margin
  const height = contentHeight + 2 * margin
  const viewBoxMinX = bbox.minX - margin
  const viewBoxMinY = bbox.minY - margin
  const viewBox = `${viewBoxMinX} ${viewBoxMinY} ${width} ${height}`

  // Calculate the Y-axis flip point considering the viewBox offset
  const flipY = bbox.maxY + bbox.minY

  // Generate shape SVGs
  const shapeSvgs = shapes.map(svgForShape).join("\n")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">
  <rect width="100%" height="100%" fill="white"/>
  <g transform="matrix(1 0 0 -1 0 ${flipY})">
${shapeSvgs}
  </g>
</svg>`
}
