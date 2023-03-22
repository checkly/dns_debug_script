###
NodeJS DNS debug script

- Dockerfile to push it to a AWS Lambda function
- index.js contains all the code
run it in a loop in your terminal and filter the output a bit with jq like so:
```
while :; do node index.js >>data.json; tail -1 data.json | jq -c '{"nodejs": .nodejs.dns ,"trace": .tracert.totalTimeTrace, "dnsTrace": .dnsTrace.totalTimeDNSTrace, "recursive": .dnsquery.totalTimeRecursiveResolve, id} ';sleep 5; done
```

See the Checkly blog post for more details