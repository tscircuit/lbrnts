import { expect, test } from "bun:test"
import {
  CutSetting,
  generateLightBurnSvg,
  LightBurnProject,
  ShapeEllipse,
  ShapeGroup,
  ShapeRect,
} from "../../index"

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
