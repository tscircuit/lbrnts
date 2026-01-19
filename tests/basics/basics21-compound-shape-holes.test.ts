import { describe, expect, test } from "bun:test"
import {
  CutSetting,
  generateLightBurnSvg,
  LightBurnProject,
  ShapeEllipse,
  ShapeGroup,
  ShapePath,
  ShapeRect,
} from "../../index"

describe("Compound shapes with holes", () => {
  test("ShapeGroup with outer rect and inner circular hole renders with nonzero fill-rule", async () => {
    // Create a cut setting for engraving (Scan mode to show fill)
    const cutSetting = new CutSetting({
      index: 0,
      name: "Scan Test",
      priority: 0,
      type: "Scan",
      speed: 100,
      maxPower: 50,
      interval: 2, // Large interval so we can see individual lines in preview
    })

    // Create outer square path (clockwise winding)
    const outerSquare = new ShapePath({
      cutIndex: 0,
      verts: [
        { x: 0, y: 0 }, // bottom-left
        { x: 50, y: 0 }, // bottom-right
        { x: 50, y: 50 }, // top-right
        { x: 0, y: 50 }, // top-left
      ],
      prims: [
        { type: 0 }, // LineTo
        { type: 0 },
        { type: 0 },
        { type: 0 },
      ],
      isClosed: true,
    })

    // Create inner circular hole (counter-clockwise winding)
    // Using a square approximation for simplicity, but wound counter-clockwise
    const innerHole = new ShapePath({
      cutIndex: 0,
      verts: [
        { x: 15, y: 15 }, // bottom-left
        { x: 15, y: 35 }, // top-left (going counter-clockwise)
        { x: 35, y: 35 }, // top-right
        { x: 35, y: 15 }, // bottom-right
      ],
      prims: [
        { type: 0 },
        { type: 0 },
        { type: 0 },
        { type: 0 },
      ],
      isClosed: true,
    })

    // Create a ShapeGroup containing both shapes
    const group = new ShapeGroup()
    group.cutIndex = 0
    group.children = [outerSquare, innerHole]

    // Create the project
    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      materialHeight: 0,
      children: [cutSetting, group],
    })

    // Generate SVG
    const svg = generateLightBurnSvg(project)

    // Verify the SVG contains the compound path with nonzero fill-rule
    expect(svg).toContain("fill-rule")
    expect(svg).toContain("nonzero")

    // Verify it's a compound path (both shapes combined into path elements)
    // We expect 2 path elements: one inside clipPath for clipping, one for outline stroke
    const pathMatches = svg.match(/<path[^>]+d="([^"]+)"/g) || []
    expect(pathMatches.length).toBe(2)

    // Both paths should have the same combined path data with 2 "M" commands
    // (one for outer square, one for inner hole)
    for (const pathMatch of pathMatches) {
      const mCount = (pathMatch.match(/M\s/g) || []).length
      expect(mCount).toBe(2)
    }

    // Verify clipPath is created for scan fill
    expect(svg).toContain("clipPath")
    expect(svg).toContain("clip-rule")

    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })

  test("ShapeGroup with rect and ellipse hole renders correctly", async () => {
    // Create a cut setting (Cut mode - no fill)
    const cutSetting = new CutSetting({
      index: 0,
      name: "Cut",
      priority: 0,
      type: "Cut",
      speed: 10,
      maxPower: 80,
    })

    // Create outer rectangle
    const outerRect = new ShapeRect()
    outerRect.cutIndex = 0
    outerRect.w = 60
    outerRect.h = 40
    outerRect.xform = [1, 0, 0, 1, 0, 0] // identity at origin

    // Create inner ellipse hole (centered in the rect)
    const innerEllipse = new ShapeEllipse()
    innerEllipse.cutIndex = 0
    innerEllipse.rx = 10
    innerEllipse.ry = 8
    innerEllipse.xform = [1, 0, 0, 1, 30, 20] // centered at (30, 20)

    // Create group
    const group = new ShapeGroup()
    group.cutIndex = 0
    group.children = [outerRect, innerEllipse]

    // Create project
    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      materialHeight: 0,
      children: [cutSetting, group],
    })

    // Generate SVG
    const svg = generateLightBurnSvg(project)

    // Verify compound path rendering
    expect(svg).toContain("fill-rule")
    expect(svg).toContain("nonzero")

    // Should be a single combined path (no clipPath since it's Cut mode, not Scan)
    const pathMatches = svg.match(/<path[^>]+d="([^"]+)"/g) || []
    expect(pathMatches.length).toBe(1)

    // Path should contain curve commands (C) for the ellipse
    expect(svg).toContain(" C ")

    // Path should have 2 subpaths (rect + ellipse)
    const pathData = pathMatches[0]!
    const mCount = (pathData.match(/M\s/g) || []).length
    expect(mCount).toBe(2)

    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })

  test("Standalone shapes still render individually", async () => {
    // Test that non-grouped shapes still work correctly
    const cutSetting = new CutSetting({
      index: 0,
      name: "Cut",
      priority: 0,
      type: "Cut",
      speed: 10,
      maxPower: 80,
    })

    // Two separate shapes (not in a group)
    const rect = new ShapeRect()
    rect.cutIndex = 0
    rect.w = 30
    rect.h = 30
    rect.xform = [1, 0, 0, 1, 0, 0]

    const ellipse = new ShapeEllipse()
    ellipse.cutIndex = 0
    ellipse.rx = 10
    ellipse.ry = 10
    ellipse.xform = [1, 0, 0, 1, 50, 15]

    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      materialHeight: 0,
      children: [cutSetting, rect, ellipse],
    })

    const svg = generateLightBurnSvg(project)

    // Should have separate elements (rect and circle/ellipse)
    expect(svg).toContain("<rect")
    expect(svg).toContain("<circle") // or ellipse

    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })
})
