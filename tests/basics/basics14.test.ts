import { expect, test, describe } from "bun:test"
import { readFileSync } from "node:fs"
import { LightBurnBaseElement, generateLightBurnSvg } from "../../index"

describe("LockingJig Teeth (.lbrn2 v2) - tooth profiles", () => {
  test("parse and generate SVG snapshot", async () => {
    const xml = readFileSync("tests/assets/LockingJig_Teeth.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain('<svg')
    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })
})
