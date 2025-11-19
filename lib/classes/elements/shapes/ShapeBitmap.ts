import { LightBurnBaseElement } from "../../LightBurnBaseElement"
import type { XmlJsonElement } from "../../../xml-parsing/xml-parsing-types"
import { ShapeBase } from "./ShapeBase"
import { num, str, boolish } from "../_coerce"

export class ShapeBitmap extends ShapeBase {
  private _w?: number
  private _h?: number
  private _dataBase64?: string
  private _grayscale?: boolean
  private _dpi?: number
  private _ditherMode?: string
  private _halftone?: boolean
  private _negative?: boolean
  private _brightnessAdjust?: number
  private _contrastAdjust?: number
  private _gammaAdjust?: number

  constructor() {
    super()
    this.token = "Shape.Bitmap"
  }

  get w(): number | undefined { return this._w }
  set w(value: number | undefined) { this._w = value }

  get h(): number | undefined { return this._h }
  set h(value: number | undefined) { this._h = value }

  get dataBase64(): string | undefined { return this._dataBase64 }
  set dataBase64(value: string | undefined) { this._dataBase64 = value }

  get grayscale(): boolean | undefined { return this._grayscale }
  set grayscale(value: boolean | undefined) { this._grayscale = value }

  get dpi(): number | undefined { return this._dpi }
  set dpi(value: number | undefined) { this._dpi = value }

  get ditherMode(): string | undefined { return this._ditherMode }
  set ditherMode(value: string | undefined) { this._ditherMode = value }

  get halftone(): boolean | undefined { return this._halftone }
  set halftone(value: boolean | undefined) { this._halftone = value }

  get negative(): boolean | undefined { return this._negative }
  set negative(value: boolean | undefined) { this._negative = value }

  get brightnessAdjust(): number | undefined { return this._brightnessAdjust }
  set brightnessAdjust(value: number | undefined) { this._brightnessAdjust = value }

  get contrastAdjust(): number | undefined { return this._contrastAdjust }
  set contrastAdjust(value: number | undefined) { this._contrastAdjust = value }

  get gammaAdjust(): number | undefined { return this._gammaAdjust }
  set gammaAdjust(value: number | undefined) { this._gammaAdjust = value }

  static override fromXmlJson(node: XmlJsonElement): ShapeBitmap {
    const bitmap = new ShapeBitmap()
    const common = ShapeBase.readCommon(node)
    Object.assign(bitmap, common)

    if (node.$) {
      bitmap.w = num(node.$.W, undefined)
      bitmap.h = num(node.$.H, undefined)
      bitmap.grayscale = boolish(node.$.Grayscale, undefined)
      bitmap.negative = boolish(node.$.Negative, undefined)
      bitmap.dataBase64 = str(node.$.Data, undefined)
    }

    // Helper function to parse child element value
    const getChildValue = (key: string): any => {
      const child = (node as any)[key]
      return child?.$?.Value
    }

    // Parse additional properties
    bitmap.dpi = num(getChildValue("DPI"), undefined)
    bitmap.ditherMode = str(getChildValue("DitherMode"), undefined)
    bitmap.halftone = boolish(getChildValue("Halftone"), undefined)
    bitmap.brightnessAdjust = num(getChildValue("BrightnessAdjust"), undefined)
    bitmap.contrastAdjust = num(getChildValue("ContrastAdjust"), undefined)
    bitmap.gammaAdjust = num(getChildValue("GammaAdjust"), undefined)

    return bitmap
  }
}

LightBurnBaseElement.register("Shape.Bitmap", ShapeBitmap)
