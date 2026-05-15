import { LightBurnBaseElement } from "./classes/LightBurnBaseElement"
import { CutSetting } from "./classes/elements/CutSetting"
import { LightBurnProject } from "./classes/elements/LightBurnProject"
import { ShapeBase } from "./classes/elements/shapes/ShapeBase"
import { ShapeGroup } from "./classes/elements/shapes/ShapeGroup"

export interface SplitLightBurnProjectFile {
  fileName: string
  content: string
  cutIndex: number
  cutSettingName: string
  shapeCount: number
}

function parseProject(input: string | LightBurnProject): LightBurnProject {
  if (input instanceof LightBurnProject) return input

  const parsed = LightBurnBaseElement.parse(input)
  if (!(parsed instanceof LightBurnProject)) {
    throw new Error("Expected a LightBurnProject XML document")
  }

  return parsed
}

function fileBaseName(name: string, cutIndex: number): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `cut-index-${cutIndex}`
  )
}

function uniqueFileName(baseName: string, usedFileNames: Set<string>): string {
  let fileName = `${baseName}.lbrn2`
  let suffix = 2

  while (usedFileNames.has(fileName)) {
    fileName = `${baseName}-${suffix}.lbrn2`
    suffix += 1
  }

  usedFileNames.add(fileName)
  return fileName
}

function folderNameForFile(fileName?: string): string | undefined {
  if (!fileName) return undefined

  const baseName = fileName.split(/[\\/]/).pop() ?? fileName
  return fileBaseName(baseName.replace(/\.lbrn2?$/i, ""), 0)
}

function cloneGroup(group: ShapeGroup, children: LightBurnBaseElement[]) {
  const clone = Object.assign(
    Object.create(Object.getPrototypeOf(group)),
    group,
  )
  clone.children = children
  return clone
}

function countShapes(element: LightBurnBaseElement): number {
  if (element instanceof ShapeGroup) {
    return element.children.reduce((sum, child) => sum + countShapes(child), 0)
  }
  return element instanceof ShapeBase ? 1 : 0
}

function filterShapeForCutIndex(
  element: LightBurnBaseElement,
  cutIndex: number,
): { shape?: LightBurnBaseElement; count: number } {
  if (element instanceof ShapeGroup) {
    if (element.cutIndex === cutIndex) {
      return {
        shape: cloneGroup(element, [...element.children]),
        count: countShapes(element),
      }
    }

    const children: LightBurnBaseElement[] = []
    let count = 0

    for (const child of element.children) {
      const result = filterShapeForCutIndex(child, cutIndex)
      if (result.shape) children.push(result.shape)
      count += result.count
    }

    return children.length > 0
      ? { shape: cloneGroup(element, children), count }
      : { count }
  }

  if (element instanceof ShapeBase && element.cutIndex === cutIndex) {
    return { shape: element, count: 1 }
  }

  return { count: 0 }
}

function projectForCutSetting(
  project: LightBurnProject,
  cutSetting: CutSetting,
): { project: LightBurnProject; shapeCount: number } {
  const children: LightBurnBaseElement[] = []
  const cutIndex = cutSetting.index!
  let shapeCount = 0

  for (const child of project.children) {
    if (child instanceof CutSetting) {
      if (child === cutSetting) children.push(child)
      continue
    }

    if (child instanceof ShapeBase) {
      const result = filterShapeForCutIndex(child, cutIndex)
      if (result.shape) children.push(result.shape)
      shapeCount += result.count
      continue
    }

    children.push(child)
  }

  return {
    project: new LightBurnProject({
      appVersion: project.appVersion,
      formatVersion: project.formatVersion,
      materialHeight: project.materialHeight,
      mirrorX: project.mirrorX,
      mirrorY: project.mirrorY,
      children,
    }),
    shapeCount,
  }
}

export function splitLightBurnProjectByCutSetting(
  input: string | LightBurnProject,
  originalFileName?: string,
): SplitLightBurnProjectFile[] {
  const project = parseProject(input)
  const folderName = folderNameForFile(originalFileName)
  const usedFileNames = new Set<string>()
  const files: SplitLightBurnProjectFile[] = []

  for (const cutSetting of project.children) {
    if (!(cutSetting instanceof CutSetting) || cutSetting.index === undefined) {
      continue
    }

    const cutIndex = cutSetting.index
    const cutSettingName = cutSetting.name ?? `CutIndex ${cutIndex}`
    const split = projectForCutSetting(project, cutSetting)
    const fileName = uniqueFileName(
      fileBaseName(cutSettingName, cutIndex),
      usedFileNames,
    )

    files.push({
      fileName: folderName ? `${folderName}/${fileName}` : fileName,
      content: split.project.getString(),
      cutIndex,
      cutSettingName,
      shapeCount: split.shapeCount,
    })
  }

  return files
}
