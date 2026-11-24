import { expect, test } from "bun:test"
import { LightBurnBaseElement, LightBurnProject, ShapeText } from "../index"

test("ShapeText roundtrip preserves type, text, and font", () => {
  const text = new ShapeText()
  text.text = "Serial 001"
  text.font = "Arial"
  text.cutIndex = 2

  const project = new LightBurnProject({ children: [text] })
  const parsed = LightBurnBaseElement.parse(project.getString())

  expect(parsed).toBeInstanceOf(LightBurnProject)
  if (parsed instanceof LightBurnProject) {
    const shape = parsed.children[0]
    expect(shape).toBeInstanceOf(ShapeText)
    if (shape instanceof ShapeText) {
      expect(shape.text).toBe("Serial 001")
      expect(shape.font).toBe("Arial")
      expect(shape.cutIndex).toBe(2)
    }
  }
})
