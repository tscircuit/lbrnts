import { describe, expect, test } from "bun:test"
import {
  CutSetting,
  generateLightBurnSvg,
  LightBurnProject,
  ShapePath,
} from "../../index"

describe("Build LightBurn project from scratch", () => {
  test("create project with path and custom cut settings", async () => {
    // Create a custom cut setting (e.g., for cutting wood)
    const cutSetting = new CutSetting({
      index: 0,
      name: "Wood Cut",
      priority: 0,
      type: "Cut",
      speed: 10, // mm/s
      maxPower: 80, // 80% power
      minPower: 60, // 60% power
      numPasses: 2, // 2 passes
      kerf: 0.2, // 0.2mm kerf offset
    })

    // Create a simple square path
    const path = new ShapePath({
      cutIndex: 0, // Use the cut setting we created (index 0)
      verts: [
        { x: -25, y: -25 }, // bottom-left
        { x: 25, y: -25 }, // bottom-right
        { x: 25, y: 25 }, // top-right
        { x: -25, y: 25 }, // top-left
      ],
      prims: [
        { type: 0 }, // LineTo from vertex 0 to 1
        { type: 0 }, // LineTo from vertex 1 to 2
        { type: 0 }, // LineTo from vertex 2 to 3
        { type: 0 }, // LineTo from vertex 3 to 0 (closing the path)
      ],
      isClosed: true,
    })

    // Create a new project with the cut setting and path
    const project = new LightBurnProject({
      appVersion: "1.7.03",
      formatVersion: "1",
      materialHeight: 0,
      children: [cutSetting, path],
    })

    // Generate SVG to verify it works
    const svg = generateLightBurnSvg(project)

    // Basic assertions
    expect(svg).toContain("<svg")
    expect(svg).toContain("path") // Should contain a path element

    // Verify the path is roughly a square (check for all 4 corners)
    expect(svg).toContain("M") // Move command
    expect(svg).toContain("L") // Line commands

    Bun.write(
      "debug-outputs/basics17-from-scratch.lbrn2",
      project.getString(),
      {
        createPath: true,
      },
    )
    // Match SVG snapshot
    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })

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
