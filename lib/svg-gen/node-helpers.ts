import type { INode } from "svgson"

export const g = (
  attrs: Record<string, string>,
  children: INode[] = [],
): INode => ({
  name: "g",
  type: "element",
  value: "",
  attributes: attrs,
  children,
})

export const leaf = (name: string, attrs: Record<string, string>): INode => ({
  name,
  type: "element",
  value: "",
  attributes: attrs,
  children: [],
})

export const textNode = (value: string): INode => ({
  name: "",
  type: "text",
  value,
  attributes: {},
  children: [],
})
