const fs = require('fs')
    , ini = require('ini')

const configFile = '/home/acs/fap-configurations/config.cfg'

function parse(value, type) {
  if (value === '')
    return value

  if (type === 'xsd:int' || type === 'xsd:unsignedInt' || type === 'xsd:signedInt') {
    return parseInt(value)
  } else if (type === 'xsd:boolean') {
    return value === 'true'
  }
  return value
}

function makeSingleNeighbourConfiguration(commonConfiguration, neighbourCellConfiguration, neighbourIndex) {
    const pre = `Device.Services.FAPService.1.CellConfig.UMTS.RAN.NeighborList.IntraFreqCell.${neighbourIndex}`
    let result = {}

    const getField = key => neighbourCellConfiguration.hasOwnProperty(key) ? neighbourCellConfiguration[key] : commonConfiguration[key]

    const [lac, rac] = getField('Device.Services.FAPService.1.CellConfig.UMTS.CN.LACRAC').split(/:|\|/)

    result[`${pre}.CID`] = getField('Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellID')
    result[`${pre}.LAC`] = `${lac}|xsd:unsignedInt`
    result[`${pre}.RAC`] = `${rac}|xsd:unsignedInt`
    result[`${pre}.RNCID`] = getField('Device.Services.FAPService.1.CellConfig.UMTS.RAN.RNCID')
    result[`${pre}.PCPICHScramblingCode`] = getField('Device.Services.FAPService.1.CellConfig.UMTS.RAN.RF.PrimaryScramblingCode').split('|')[0]+ '|xsd:unsignedInt'
    result[`${pre}.PLMNID`] = getField('Device.Services.FAPService.1.CellConfig.UMTS.CN.PLMNID')
    result[`${pre}.X_000295_TxDiversityIndicator`] = '1|xsd:unsignedInt'

    return result
}

function getNeigboursConfiguration(config, serialNumber) {
    neighbours = Object
        .keys(config)
        .filter(key => key !== 'Common' && key !== serialNumber)
        .map(key => config[key])
        .map((neighbourCellConfiguration, i) => {
            const index = i + 1
            return makeSingleNeighbourConfiguration(config['Common'], neighbourCellConfiguration, index)
        })

    return Object.assign({}, ...neighbours)
}

function getConfiguration(args, callback) {
  const serialNumber = args[0]
  try {
    const config = ini.parse(fs.readFileSync(configFile, 'utf-8'))

    const commonConfiguration = config['Common']

    const specificConfiguration = config[serialNumber] || {}

    const neighboursConfiguration = getNeigboursConfiguration(config, serialNumber)

    const mergedConfiguration = Object.assign(commonConfiguration, specificConfiguration, neighboursConfiguration)

    const result = Object.keys(mergedConfiguration).map(propertyName => {
      const [value, type] = mergedConfiguration[propertyName].split('|')

      return [propertyName, parse(value, type), type]
    })

    return callback(null, result)
  } catch (e) {
    return callback(e, null)
  }
}

exports.getConfiguration = getConfiguration
