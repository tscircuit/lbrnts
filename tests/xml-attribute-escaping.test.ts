import { describe, expect, test } from "bun:test"
import { XMLValidator } from "fast-xml-parser"
import { CutSetting, LightBurnBaseElement, LightBurnProject } from "../index"

describe("XML attribute escaping", () => {
  test("escapes ampersands in cut setting names", () => {
    const setting = new CutSetting({ name: "Wood & Acrylic" })
    expect(setting.getString()).toContain('<name Value="Wood &amp; Acrylic"/>')
  })

  test("escapes XML delimiters in cut setting names", () => {
    const setting = new CutSetting({
      name: `Gravure d'été "front" < 0.5 > 0.2`,
    })
    expect(setting.getString()).toContain(
      '<name Value="Gravure d&apos;été &quot;front&quot; &lt; 0.5 &gt; 0.2"/>',
    )
  })

  test.each([
    "Wood & Acrylic",
    'Cut "front" < 0.5 > 0.2',
    "Literal &amp; and &#65;",
    "Gravure d'été 日本語",
    "",
  ])("preserves the cut setting name %j", (name) => {
    const project = new LightBurnProject({
      children: [new CutSetting({ index: 0, name, speed: 10 })],
    })

    let xml = project.getString()
    for (let round = 0; round < 2; round++) {
      expect(XMLValidator.validate(xml)).toBe(true)
      const parsed = LightBurnBaseElement.parse(xml)
      expect(parsed).toBeInstanceOf(LightBurnProject)
      if (!(parsed instanceof LightBurnProject))
        throw new Error("Expected project")
      expect(parsed.children).toHaveLength(1)
      const cutSetting = parsed.children[0]
      expect(cutSetting).toBeInstanceOf(CutSetting)
      if (!(cutSetting instanceof CutSetting))
        throw new Error("Expected cut setting")
      expect(cutSetting.name).toBe(name)
      expect(cutSetting.index).toBe(0)
      expect(cutSetting.speed).toBe(10)
      xml = parsed.getString()
    }
  })

  test("escapes attributes serialized by the base element", () => {
    const appVersion = '1.7 "preview" & <custom>'
    const project = new LightBurnProject({
      appVersion,
      materialHeight: 0,
      mirrorX: false,
      mirrorY: true,
    })
    const xml = project.getString()
    expect(XMLValidator.validate(xml)).toBe(true)
    const parsed = LightBurnBaseElement.parse(xml)
    expect(parsed).toBeInstanceOf(LightBurnProject)
    if (!(parsed instanceof LightBurnProject))
      throw new Error("Expected project")
    expect(parsed.appVersion).toBe(appVersion)
    expect(parsed.materialHeight).toBe(0)
    expect(parsed.mirrorX).toBe(false)
    expect(parsed.mirrorY).toBe(true)
  })

  test("preserves names when reserializing an existing project", () => {
    const project = LightBurnBaseElement.parse(
      '<LightBurnProject><CutSetting type="Cut"><name Value="Cut &quot;A&quot; &amp; B"/></CutSetting></LightBurnProject>',
    )
    expect(project).toBeInstanceOf(LightBurnProject)
    if (!(project instanceof LightBurnProject))
      throw new Error("Expected project")
    expect(project.getString()).toContain(
      '<name Value="Cut &quot;A&quot; &amp; B"/>',
    )
  })
})
