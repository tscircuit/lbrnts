import { parseString } from "xml2js"

export const parseXml = (xml: string): any => {
  let err: Error | null = null
  let result: any = null

  parseString(xml, (err_, result_) => {
    err = err_
    result = result_
  })

  if (err) {
    throw err
  }

  return result
}
