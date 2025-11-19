import { expect, test, describe } from "bun:test"
import { readFileSync } from "node:fs"
import { LightBurnBaseElement, generateLightBurnSvg } from "../../index"

describe("LockingJig Fence (.lbrn2 v2) - jig geometry", () => {
  test("parse and generate SVG snapshot", async () => {
    const xml = readFileSync("tests/assets/LockingJig_Fence.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain('<svg')
    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })
})
