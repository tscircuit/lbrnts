import { expect, test } from "bun:test"
import {
  CutSetting,
  generateLightBurnSvg,
  LightBurnProject,
  ShapeEllipse,
  ShapeRect,
} from "../../index"

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
