import type { XmlJsonElement } from "../../xml-parsing/xml-parsing-types"
import { LightBurnBaseElement } from "../LightBurnBaseElement"
import { boolish, num, str } from "./_coerce"

export interface CutSettingInit {
  type?: string
  index?: number
  name?: string
  priority?: number
  minPower?: number
  maxPower?: number
  minPower2?: number
  maxPower2?: number
  speed?: number
  kerf?: number
  zOffset?: number
  enablePowerRamp?: boolean
  rampLength?: number
  numPasses?: number
  zPerPass?: number
  perforate?: boolean
  dotMode?: boolean
  scanOpt?: string
  interval?: number
  angle?: number
  overScanning?: number
  lineAngle?: number
  crossHatch?: boolean
  frequency?: number
  pulseWidth?: number
}

export class CutSetting extends LightBurnBaseElement {
  private _type = "Cut"
  private _index?: number
  private _name?: string
  private _priority?: number
  private _minPower?: number
  private _maxPower?: number
  private _minPower2?: number
  private _maxPower2?: number
  private _speed?: number
  private _kerf?: number
  private _zOffset?: number
  private _enablePowerRamp?: boolean
  private _rampLength?: number
  private _numPasses?: number
  private _zPerPass?: number
  private _perforate?: boolean
  private _dotMode?: boolean
  private _scanOpt?: string
  private _interval?: number
  private _angle?: number
  private _overScanning?: number
  private _lineAngle?: number
  private _crossHatch?: boolean
  private _frequency?: number
  private _pulseWidth?: number

  constructor(init?: CutSettingInit) {
    super()
    this.token = "CutSetting"
    if (init) {
      if (init.type !== undefined) this._type = init.type
      if (init.index !== undefined) this._index = init.index
      if (init.name !== undefined) this._name = init.name
      if (init.priority !== undefined) this._priority = init.priority
      if (init.minPower !== undefined) this._minPower = init.minPower
      if (init.maxPower !== undefined) this._maxPower = init.maxPower
      if (init.minPower2 !== undefined) this._minPower2 = init.minPower2
      if (init.maxPower2 !== undefined) this._maxPower2 = init.maxPower2
      if (init.speed !== undefined) this._speed = init.speed
      if (init.kerf !== undefined) this._kerf = init.kerf
      if (init.zOffset !== undefined) this._zOffset = init.zOffset
      if (init.enablePowerRamp !== undefined)
        this._enablePowerRamp = init.enablePowerRamp
      if (init.rampLength !== undefined) this._rampLength = init.rampLength
      if (init.numPasses !== undefined) this._numPasses = init.numPasses
      if (init.zPerPass !== undefined) this._zPerPass = init.zPerPass
      if (init.perforate !== undefined) this._perforate = init.perforate
      if (init.dotMode !== undefined) this._dotMode = init.dotMode
      if (init.scanOpt !== undefined) this._scanOpt = init.scanOpt
      if (init.interval !== undefined) this._interval = init.interval
      if (init.angle !== undefined) this._angle = init.angle
      if (init.overScanning !== undefined)
        this._overScanning = init.overScanning
      if (init.lineAngle !== undefined) this._lineAngle = init.lineAngle
      if (init.crossHatch !== undefined) this._crossHatch = init.crossHatch
      if (init.frequency !== undefined) this._frequency = init.frequency
      if (init.pulseWidth !== undefined) this._pulseWidth = init.pulseWidth
    }
  }

  get type(): string {
    return this._type
  }
  set type(value: string) {
    this._type = value
  }

  get index(): number | undefined {
    return this._index
  }
  set index(value: number | undefined) {
    this._index = value
  }

  get name(): string | undefined {
    return this._name
  }
  set name(value: string | undefined) {
    this._name = value
  }

  get priority(): number | undefined {
    return this._priority
  }
  set priority(value: number | undefined) {
    this._priority = value
  }

  get minPower(): number | undefined {
    return this._minPower
  }
  set minPower(value: number | undefined) {
    this._minPower = value
  }

  get maxPower(): number | undefined {
    return this._maxPower
  }
  set maxPower(value: number | undefined) {
    this._maxPower = value
  }

  get minPower2(): number | undefined {
    return this._minPower2
  }
  set minPower2(value: number | undefined) {
    this._minPower2 = value
  }

  get maxPower2(): number | undefined {
    return this._maxPower2
  }
  set maxPower2(value: number | undefined) {
    this._maxPower2 = value
  }

  get speed(): number | undefined {
    return this._speed
  }
  set speed(value: number | undefined) {
    this._speed = value
  }

  get kerf(): number | undefined {
    return this._kerf
  }
  set kerf(value: number | undefined) {
    this._kerf = value
  }

  get zOffset(): number | undefined {
    return this._zOffset
  }
  set zOffset(value: number | undefined) {
    this._zOffset = value
  }

  get enablePowerRamp(): boolean | undefined {
    return this._enablePowerRamp
  }
  set enablePowerRamp(value: boolean | undefined) {
    this._enablePowerRamp = value
  }

  get rampLength(): number | undefined {
    return this._rampLength
  }
  set rampLength(value: number | undefined) {
    this._rampLength = value
  }

  get numPasses(): number | undefined {
    return this._numPasses
  }
  set numPasses(value: number | undefined) {
    this._numPasses = value
  }

  get zPerPass(): number | undefined {
    return this._zPerPass
  }
  set zPerPass(value: number | undefined) {
    this._zPerPass = value
  }

  get perforate(): boolean | undefined {
    return this._perforate
  }
  set perforate(value: boolean | undefined) {
    this._perforate = value
  }

  get dotMode(): boolean | undefined {
    return this._dotMode
  }
  set dotMode(value: boolean | undefined) {
    this._dotMode = value
  }

  get scanOpt(): string | undefined {
    return this._scanOpt
  }
  set scanOpt(value: string | undefined) {
    this._scanOpt = value
  }

  get interval(): number | undefined {
    return this._interval
  }
  set interval(value: number | undefined) {
    this._interval = value
  }

  get angle(): number | undefined {
    return this._angle
  }
  set angle(value: number | undefined) {
    this._angle = value
  }

  get overScanning(): number | undefined {
    return this._overScanning
  }
  set overScanning(value: number | undefined) {
    this._overScanning = value
  }

  get lineAngle(): number | undefined {
    return this._lineAngle
  }
  set lineAngle(value: number | undefined) {
    this._lineAngle = value
  }

  get crossHatch(): boolean | undefined {
    return this._crossHatch
  }
  set crossHatch(value: boolean | undefined) {
    this._crossHatch = value
  }

  get frequency(): number | undefined {
    return this._frequency
  }
  set frequency(value: number | undefined) {
    this._frequency = value
  }

  get pulseWidth(): number | undefined {
    return this._pulseWidth
  }
  set pulseWidth(value: number | undefined) {
    this._pulseWidth = value
  }

  override getXmlAttributes(): Record<
    string,
    string | number | boolean | undefined
  > {
    return {
      type: this._type,
    }
  }

  override getChildren(): LightBurnBaseElement[] {
    const children: LightBurnBaseElement[] = []
    const props = [
      "index",
      "name",
      "priority",
      "minPower",
      "maxPower",
      "minPower2",
      "maxPower2",
      "speed",
      "kerf",
      "zOffset",
      "enablePowerRamp",
      "rampLength",
      "numPasses",
      "zPerPass",
      "perforate",
      "dotMode",
      "scanOpt",
      "interval",
      "angle",
      "overScanning",
      "lineAngle",
      "crossHatch",
      "frequency",
      "pulseWidth",
    ]

    for (const prop of props) {
      const value = (this as any)[`_${prop}`]
      if (value !== undefined) {
        children.push(new CutSettingPropertyElement(prop, value))
      }
    }

    return children
  }

  static override fromXmlJson(node: XmlJsonElement): CutSetting {
    const cs = new CutSetting()

    if (node.$) {
      cs.type = str(node.$.type, "Cut")
    }

    // Helper function to parse child element value
    const getChildValue = (key: string): any => {
      const child = (node as any)[key]
      return child?.$?.Value
    }

    // Parse all known child elements
    cs.index = num(getChildValue("index"), undefined)
    cs.name = str(getChildValue("name"), undefined)
    cs.priority = num(getChildValue("priority"), undefined)
    cs.minPower = num(getChildValue("minPower"), undefined)
    cs.maxPower = num(getChildValue("maxPower"), undefined)
    cs.minPower2 = num(getChildValue("minPower2"), undefined)
    cs.maxPower2 = num(getChildValue("maxPower2"), undefined)
    cs.speed = num(getChildValue("speed"), undefined)
    cs.kerf = num(getChildValue("kerf"), undefined)
    cs.zOffset = num(getChildValue("zOffset"), undefined)
    cs.enablePowerRamp = boolish(getChildValue("enablePowerRamp"), undefined)
    cs.rampLength = num(getChildValue("rampLength"), undefined)
    cs.numPasses = num(getChildValue("numPasses"), undefined)
    cs.zPerPass = num(getChildValue("zPerPass"), undefined)
    cs.perforate = boolish(getChildValue("perforate"), undefined)
    cs.dotMode = boolish(getChildValue("dotMode"), undefined)
    cs.scanOpt = str(getChildValue("scanOpt"), undefined)
    cs.interval = num(getChildValue("interval"), undefined)
    cs.angle = num(getChildValue("angle"), undefined)
    cs.overScanning = num(getChildValue("overScanning"), undefined)
    cs.lineAngle = num(getChildValue("lineAngle"), undefined)
    cs.crossHatch = boolish(getChildValue("crossHatch"), undefined)
    cs.frequency = num(getChildValue("frequency"), undefined)
    cs.pulseWidth = num(getChildValue("pulseWidth"), undefined)

    return cs
  }
}

/**
 * Special element to represent a CutSetting property with a Value attribute
 */
class CutSettingPropertyElement extends LightBurnBaseElement {
  private propName: string
  private propValue: any

  constructor(propName: string, propValue: any) {
    super()
    this.token = propName
    this.propName = propName
    this.propValue = propValue
  }

  private formatValue(value: any): string {
    if (typeof value === "number") {
      // For very small numbers, use decimal notation to match LightBurn format
      if (value !== 0 && Math.abs(value) < 0.001) {
        return value.toFixed(9).replace(/\.?0+$/, "")
      }
      // For other numbers, use default string representation
      return value.toString()
    }
    return String(value)
  }

  override toXml(indent = 0): string {
    const indentStr = "    ".repeat(indent)
    return `${indentStr}<${this.propName} Value="${this.formatValue(this.propValue)}"/>`
  }
}

LightBurnBaseElement.register("CutSetting", CutSetting)
