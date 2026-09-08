import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import {
  generateLightBurnSvg,
  LightBurnBaseElement,
  LightBurnProject,
  ShapePolygon,
} from "../index"

describe("Shape.Polygon", () => {
  test("parses LightBurn Polygon instead of throwing", () => {
    const xml = readFileSync("tests/fixtures/simple-polygon.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)

    expect(project).toBeInstanceOf(LightBurnProject)
    if (project instanceof LightBurnProject) {
      expect(project.children).toHaveLength(1)
      const shape = project.children[0]
      expect(shape).toBeInstanceOf(ShapePolygon)
      if (shape instanceof ShapePolygon) {
        expect(shape.rx).toBe(40)
        expect(shape.ry).toBe(40)
        expect(shape.n).toBe(6)
        expect(shape.cutIndex).toBe(0)
        expect(shape.xform).toEqual([1, 0, 0, 1, 100, 100])
      }
    }
  })

  test("roundtrips Polygon attributes including N", () => {
    const polygon = new ShapePolygon()
    polygon.cutIndex = 1
    polygon.rx = 25
    polygon.ry = 15
    polygon.n = 8
    polygon.xform = [1, 0, 0, 1, 10, 20]

    const project = new LightBurnProject({
      appVersion: "1.6.00",
      formatVersion: "1",
      children: [polygon],
    })

    const parsed = LightBurnBaseElement.parse(project.getString())
    expect(parsed).toBeInstanceOf(LightBurnProject)
    if (parsed instanceof LightBurnProject) {
      const shape = parsed.children[0]
      expect(shape).toBeInstanceOf(ShapePolygon)
      if (shape instanceof ShapePolygon) {
        expect(shape.rx).toBe(25)
        expect(shape.ry).toBe(15)
        expect(shape.n).toBe(8)
        expect(shape.cutIndex).toBe(1)
        expect(shape.xform).toEqual([1, 0, 0, 1, 10, 20])
      }
    }
  })

  test("reads W/H as ellipse radii when Rx/Ry are omitted", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<LightBurnProject>
    <Shape Type="Polygon" CutIndex="0" W="80" H="40" N="5">
        <XForm>1 0 0 1 0 0</XForm>
    </Shape>
</LightBurnProject>`

    const project = LightBurnBaseElement.parse(xml)
    expect(project).toBeInstanceOf(LightBurnProject)
    if (project instanceof LightBurnProject) {
      const shape = project.children[0]
      expect(shape).toBeInstanceOf(ShapePolygon)
      if (shape instanceof ShapePolygon) {
        expect(shape.rx).toBe(40)
        expect(shape.ry).toBe(20)
        expect(shape.n).toBe(5)
      }
    }
  })

  test("SVG uses a closed n-gon instead of throwing No renderer", () => {
    const xml = readFileSync("tests/fixtures/simple-polygon.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain("<svg")
    expect(svg).toContain("<polygon")
    const points = svg.match(/points="([^"]+)"/)?.[1]
    expect(points).toBeTruthy()
    expect(points!.trim().split(/\s+/)).toHaveLength(6)
  })

  test("includes default XForm when serializing", () => {
    const polygon = new ShapePolygon()
    polygon.cutIndex = 0
    polygon.rx = 10
    polygon.ry = 10
    polygon.n = 3
    expect(polygon.getString()).toContain("<XForm>1 0 0 1 0 0</XForm>")
    expect(polygon.getString()).toContain('Type="Polygon"')
    expect(polygon.getString()).toContain('N="3"')
  })
})
