###
NodeJS DNS debug script

- Dockerfile to push it to a AWS Lambda function
- index.js contains all the code
run it in a loop in your terminal and filter the output a bit with jq like so:
```
while :; do node index.js >>data.json; tail -1 data.json | jq -c '{"nodejs": .nodejs.dns ,"trace": .tracert.totalTimeTrace, "dnsTrace": .dnsTrace.totalTimeDNSTrace, "recursive": .dnsquery.totalTimeRecursiveResolve, id} ';sleep 5; done
```

See the Checkly blog post here: [https://blog.checklyhq.com/dns-debugging-deep-dive/](https://blog.checklyhq.com/dns-debugging-deep-dive/) for more details.

Also check out my fork of slodns here:  [https://github.com/danielpaulus/slodns](https://github.com/danielpaulus/slodns)
