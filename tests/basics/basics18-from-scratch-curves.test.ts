import { describe, expect, test } from "bun:test"
import {
  CutSetting,
  generateLightBurnSvg,
  LightBurnProject,
  ShapePath,
} from "../../index"

describe("Build LightBurn project from scratch with curves", () => {
  test("create project with curved path and advanced cut settings", async () => {
    // Create an advanced cut setting with multiple passes and power ramping
    const cutSetting = new CutSetting({
      index: 0,
      name: "Acrylic Engrave",
      priority: 1,
      type: "Cut",
      speed: 150, // mm/s
      maxPower: 50,
      minPower: 40,
      numPasses: 3,
      enablePowerRamp: true,
      rampLength: 2, // 2mm ramp
    })

    // Create a path with bezier curves (rounded shape)
    const path = new ShapePath({
      cutIndex: 0,
      verts: [
        { x: 0, y: -30 }, // start point
        { x: 30, y: 0, c: 1, c0x: 30, c0y: -16.5, c1x: 30, c1y: -16.5 }, // curve to right with control points
        { x: 0, y: 30, c: 1, c0x: 30, c0y: 16.5, c1x: 30, c1y: 16.5 }, // curve to top
        { x: -30, y: 0, c: 1, c0x: -30, c0y: 16.5, c1x: -30, c1y: 16.5 }, // curve to left
        { x: 0, y: -30, c: 1, c0x: -30, c0y: -16.5, c1x: -30, c1y: -16.5 }, // curve back to start
      ],
      prims: [
        { type: 1 }, // BezierTo
        { type: 1 }, // BezierTo
        { type: 1 }, // BezierTo
        { type: 1 }, // BezierTo
      ],
      isClosed: true,
    })

    // Create a new project
    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      children: [cutSetting, path],
    })

    // Generate SVG
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain("<svg")
    expect(svg).toContain("path")

    // Verify bezier curves are present
    expect(svg).toMatch(/[CM]/) // Should contain move or curve commands

    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })
})
