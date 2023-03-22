const Traceroute = require('nodejs-traceroute');
const crypto = require('crypto');
const dig = require('node-dig-dns');
const apiCheck = require('./rq.js')

const rootA = "@198.41.0.4" //(a.root-servers.net.)

const digQuery = async (dns, domain)=>{
    const response = await dig(['-4', `@${dns}`,domain, 'A'])
    const datapoint = {
        "type":'recursive', "dns": dns, "domain": domain, "totalTimeRecursiveResolve": response.time, "datetime": response.datetime, 
        "server": response.server, "size": response.size
    }
    return datapoint
}

const digTrace = async (domain)=>{
    data = []
    //root query
    let response = await dig(['-4', '.', 'ANY'])
    
    let datapoint = {
        "type":'root', "dns": '', "domain": domain, "time": response.time, "datetime": response.datetime, 
        "server": response.server, "size": response.size
    }

    data.push(datapoint)

    response = await dig(['-4', rootA,'com.', 'NS', 'IN'])
    datapoint = {
        "type":'tld', "dns": rootA, "domain": domain, "time": response.time, "datetime": response.datetime, 
        "server": response.server, "size": response.size
    }
    data.push(datapoint)
    const tldServer = response.additional.find((s)=>s.type==='A')    
 
    response = await dig([ "@"+tldServer.value,domain, 'NS'])
    datapoint = {
        "type":'nameserver-resolve', "dns": tldServer.value, "domain": tldServer.domain, "time": response.time, "datetime": response.datetime, 
        "server": response.server, "size": response.size
    }
    data.push(datapoint)
    
    const ns1Ipv4DomainServers = response.additional.filter((s)=>s.type ==='A')

    ns1Promises = []
    for (const server of ns1Ipv4DomainServers){
        ns1Promises.push( dig(["@"+server.value,domain, 'A']))
    }
    const responses = await Promise.all(ns1Promises)
    for (response of responses){
        datapoint = {
            "type":'final-resolve-ns1', "dns": "ns1", "domain": domain, "time": response.time, "datetime": response.datetime, 
            "server": response.server, "size": response.size
        }
        data.push(datapoint)
    }
    
    let totalTimeDNSTrace = 0
    for (dp of data){
        totalTimeDNSTrace+=dp.time
    }
    return {totalTimeDNSTrace, dnsTraceData: data}
}

const trace = async (domain) =>{
    const tracert = []
    const p = new Promise( (resolve, reject)=>{
    try {
        const tracer = new Traceroute();
        let total_time =0
        tracer
            .on('pid', (pid) => {
                tracert.push({pid: pid});
            })
            .on('destination', (destination) => {
                tracert.push({destination: destination});
            })
            .on('hop', (hop) => {
                tracert.push({hop: hop});
                const time = parseFloat(hop.rtt1) 
                if (!isNaN(time)){
                    total_time+=time
                }
            })
            .on('close', (code) => {
                tracert.push({close: code});
                
                resolve({totalTimeTrace: total_time, traceData: tracert})
            });
    
        tracer.trace(domain);
      
    } catch (ex) {
        reject(ex)
    }
})
return p
}

const run = async ()=>{
    let id = crypto.randomUUID();

    const tracertP = process.env.TRACERT ? Promise.resolve({}): trace("8.8.8.8")
    const digTraceP = process.env.DIGTRACE ? Promise.resolve({}): digTrace("checklyhq.com", id)
    const digQueryP = process.env.RECURSIVE ? Promise.resolve({}): digQuery('8.8.8.8', 'checklyhq.com', id)
    const runApiCheckP = process.env.APICHECK ? Promise.resolve({timingPhases:{}}): apiCheck()
    tracert = await tracertP
    dnsTrace = await digTraceP
    dnsquery = await digQueryP
    apiCheckRun = await runApiCheckP
    apiCheckRun.body=''
    
    const result = JSON.stringify({tracert, dnsTrace, dnsquery, "nodejs": apiCheckRun.timingPhases, id})
    console.log(result)
    return result
}

if (process.env.AWSLAMBDA){
    exports.handler = async (event, context) => {
        const result = await run()
        return result
    }
} 
else {
    run()
}