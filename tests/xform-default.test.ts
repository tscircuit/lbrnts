import { describe, expect, test } from "bun:test"
import { ShapePath, ShapeRect, ShapeEllipse } from "../index"

describe("XForm default values", () => {
  test("ShapePath includes default XForm", () => {
    const path = new ShapePath({
      cutIndex: 0,
      verts: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      prims: [{ type: 0 }, { type: 0 }, { type: 0 }, { type: 0 }],
      isClosed: true,
    })

    const xml = path.getString()
    expect(xml).toContain("<XForm>1 0 0 1 0 0</XForm>")
  })

  test("ShapeRect includes default XForm", () => {
    const rect = new ShapeRect()
    rect.cutIndex = 0
    rect.w = 100
    rect.h = 50

    const xml = rect.getString()
    expect(xml).toContain("<XForm>1 0 0 1 0 0</XForm>")
  })

  test("ShapeEllipse includes default XForm", () => {
    const ellipse = new ShapeEllipse()
    ellipse.cutIndex = 0
    ellipse.rx = 50
    ellipse.ry = 25

    const xml = ellipse.getString()
    expect(xml).toContain("<XForm>1 0 0 1 0 0</XForm>")
  })

  test("ShapePath with custom XForm", () => {
    const path = new ShapePath({
      cutIndex: 0,
      verts: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
      prims: [{ type: 0 }],
      isClosed: false,
      xform: [2, 0, 0, 2, 100, 50], // Scale by 2 and translate to (100, 50)
    })

    const xml = path.getString()
    expect(xml).toContain("<XForm>2 0 0 2 100 50</XForm>")
  })
})
