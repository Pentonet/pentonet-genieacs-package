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

function getConfiguration(serialNumber, callback) {
  try {
    const config = ini.parse(fs.readFileSync(configFile, 'utf-8'))

    const commonConfiguration = config['Common']

    const specificConfiguration = config[serialNumber] || {}

    const mergedConfiguration = Object.assign(commonConfiguration, specificConfiguration)

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
