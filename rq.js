const rp = require('request-promise-native')
const dns = require('node:dns')

async function doRequest (config) {
    const request = rp(config)
    const maxResponseSize = 120000
    let responseBytesOrCharsLeft = 120000
    request.on('data', function (chunk) {
      responseBytesOrCharsLeft -= chunk.length
      if (responseBytesOrCharsLeft >= 0) {
        return
      }
      const err = new Error(`Response size is too big. Max allowed is ${maxResponseSize}`)
      request.destroy()
      request.emit('error', err)
      request.abort()
    })
    const requestTimeout = 120000

    const httpTimeout = setTimeout(() => {
      const err = new Error(`The request took longer to finish. Max allowed is ${requestTimeout}ms`)
      request.destroy()
      request.emit('error', err)
      request.abort()
    }, requestTimeout)
    
    try {
      return await request
    } finally {
      clearTimeout(httpTimeout)
    }
  }




const dnsFunction = function (ip,args, cb) {
  const myResolver = new dns.Resolver({timeout: 5000, tries: 5}) 
   myResolver.setServers(['8.8.8.8'])

  return myResolver.resolve(ip, function (err, ips) {
    if (err) {
      return cb(err)
    }

    return cb(null, ips[0], 4)
  })
}

const config = {
    uri: 'https://checklyhq.com',
    method: 'GET',
    timeout: 120000,
    time: true,
      resolveWithFullResponse: true,
      lookup: dnsFunction,
}
async function runRequest(){
    const result = await doRequest(config)
    return result
}


module.exports = runRequest