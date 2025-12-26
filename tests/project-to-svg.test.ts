import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import {
  generateLightBurnSvg,
  LightBurnBaseElement,
  LightBurnProject,
} from "../index"
import { ShapeEllipse } from "../lib/classes/elements/shapes/ShapeEllipse"
import { ShapePath } from "../lib/classes/elements/shapes/ShapePath"
import { ShapeRect } from "../lib/classes/elements/shapes/ShapeRect"

describe("LightBurn parsing and SVG generation", () => {
  test("parse simple rectangle project", () => {
    const xml = readFileSync("tests/fixtures/simple-rect.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)

    expect(project).toBeInstanceOf(LightBurnProject)
    if (project instanceof LightBurnProject) {
      expect(project.appVersion).toBe("1.6.00")
      expect(project.formatVersion).toBe("1")
      expect(project.materialHeight).toBe(0)
      expect(project.children).toHaveLength(1)

      const shape = project.children[0]
      expect(shape).toBeInstanceOf(ShapeRect)
      if (shape instanceof ShapeRect) {
        expect(shape.w).toBe(100)
        expect(shape.h).toBe(50)
        expect(shape.cr).toBe(0)
        expect(shape.cutIndex).toBe(0)
        expect(shape.xform).toEqual([1, 0, 0, 1, 50, 25])
      }
    }
  })

  test("generate SVG from rectangle project", async () => {
    const xml = readFileSync("tests/fixtures/simple-rect.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain("<svg")
    expect(svg).toContain("<rect")
    expect(svg).toContain('width="100"')
    expect(svg).toContain('height="50"')
    expect(svg).toContain("background-color: white")
  })

  test("parse simple ellipse project", () => {
    const xml = readFileSync("tests/fixtures/simple-ellipse.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)

    expect(project).toBeInstanceOf(LightBurnProject)
    if (project instanceof LightBurnProject) {
      expect(project.children).toHaveLength(1)

      const shape = project.children[0]
      expect(shape).toBeInstanceOf(ShapeEllipse)
      if (shape instanceof ShapeEllipse) {
        expect(shape.rx).toBe(30)
        expect(shape.ry).toBe(20)
        expect(shape.xform).toEqual([1, 0, 0, 1, 100, 75])
      }
    }
  })

  test("generate SVG from ellipse project", async () => {
    const xml = readFileSync("tests/fixtures/simple-ellipse.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain("<svg")
    expect(svg).toContain("<ellipse")
    expect(svg).toContain('rx="30"')
    expect(svg).toContain('ry="20"')
    expect(svg).toContain("background-color: white")
  })

  test("parse simple path project", () => {
    const xml = readFileSync("tests/fixtures/simple-path.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)

    expect(project).toBeInstanceOf(LightBurnProject)
    if (project instanceof LightBurnProject) {
      expect(project.children).toHaveLength(1)

      const shape = project.children[0]
      expect(shape).toBeInstanceOf(ShapePath)
      if (shape instanceof ShapePath) {
        expect(shape.verts).toHaveLength(4)
        expect(shape.prims).toHaveLength(4)
        expect(shape.verts[0]).toEqual({ x: 0, y: 0, c: 0 })
        expect(shape.verts[1]).toEqual({ x: 50, y: 0, c: 0 })
      }
    }
  })

  test("generate SVG from path project", async () => {
    const xml = readFileSync("tests/fixtures/simple-path.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain("<svg")
    expect(svg).toContain("<path")
    expect(svg).toContain('d="M')

    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })

  test("generate SVG with margin", () => {
    const xml = readFileSync("tests/fixtures/simple-rect.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)

    // Generate without margin
    const svgNoMargin = generateLightBurnSvg(project, { margin: 0 })

    // Generate with margin
    const svgWithMargin = generateLightBurnSvg(project, { margin: 10 })

    // Extract dimensions from both SVGs
    const widthMatchNoMargin = svgNoMargin.match(/width="(\d+)"/)
    const heightMatchNoMargin = svgNoMargin.match(/height="(\d+)"/)
    const widthMatchWithMargin = svgWithMargin.match(/width="(\d+)"/)
    const heightMatchWithMargin = svgWithMargin.match(/height="(\d+)"/)

    expect(widthMatchNoMargin).toBeTruthy()
    expect(heightMatchNoMargin).toBeTruthy()
    expect(widthMatchWithMargin).toBeTruthy()
    expect(heightMatchWithMargin).toBeTruthy()

    if (
      widthMatchNoMargin &&
      heightMatchNoMargin &&
      widthMatchWithMargin &&
      heightMatchWithMargin
    ) {
      const widthNoMargin = parseFloat(widthMatchNoMargin[1]!)
      const heightNoMargin = parseFloat(heightMatchNoMargin[1]!)
      const widthWithMargin = parseFloat(widthMatchWithMargin[1]!)
      const heightWithMargin = parseFloat(heightMatchWithMargin[1]!)

      // Width and height should be 20 units larger (10 margin on each side)
      expect(widthWithMargin).toBe(widthNoMargin + 20)
      expect(heightWithMargin).toBe(heightNoMargin + 20)
    }
  })
})
