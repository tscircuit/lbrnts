import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import {
  applyOffsetToLbrn,
  generateLightBurnSvg,
  LightBurnBaseElement,
  LightBurnProject,
} from "../index"

test("applies an offset to repro04 motor controller content", async () => {
  const xml = readFileSync(
    "tests/assets/repro04-motor-controller.lbrn2",
    "utf-8",
  )

  const project = LightBurnBaseElement.parse(xml)
  expect(project).toBeInstanceOf(LightBurnProject)
  if (!(project instanceof LightBurnProject)) return

  const beforeSvg = generateLightBurnSvg(project, { margin: 0 })
  await expect(beforeSvg).toMatchSvgSnapshot(import.meta.path, "before")

  const shiftedProject = applyOffsetToLbrn({
    lbrnProject: project,
    xOffset: 10,
    yOffset: -5,
  })
  expect(shiftedProject).toBe(project)

  const shiftedXml = shiftedProject.getString()
  expect(shiftedXml).not.toBe(xml)
  expect(shiftedXml).toContain("<XForm>1 0 0 1 10 -5</XForm>")

  const afterProject = LightBurnBaseElement.parse(shiftedXml)
  expect(afterProject).toBeInstanceOf(LightBurnProject)

  const afterSvg = generateLightBurnSvg(afterProject, { margin: 0 })
  expect(afterSvg).not.toBe(beforeSvg)
  expect(beforeSvg).toContain(
    'viewBox="-15.270000000000003 -8.469999999999999 97 67"',
  )
  expect(afterSvg).toContain(
    'viewBox="-5.270000000000003 -13.469999999999999 97 67"',
  )

  await expect(afterSvg).toMatchSvgSnapshot(import.meta.path, "after")
})
