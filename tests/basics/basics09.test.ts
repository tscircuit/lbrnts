import { expect, test, describe } from "bun:test"
import { readFileSync } from "node:fs"
import { LightBurnBaseElement, generateLightBurnSvg } from "../../index"

describe("ISO Keyboard (.lbrn2 v2) - dense holes/paths", () => {
  test("parse and generate SVG snapshot", async () => {
    const xml = readFileSync("tests/assets/iso_keyboard.lbrn2", "utf-8")
    const project = LightBurnBaseElement.parse(xml)
    const svg = generateLightBurnSvg(project)

    expect(svg).toContain('<svg')
    await expect(svg).toMatchSvgSnapshot(import.meta.path)
  })
})
