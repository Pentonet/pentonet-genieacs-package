#!/usr/bin/env bash

curl -i 'http://localhost:7557/provisions/myprovision' \
    -X PUT \
    --data '@/home/acs/provision.js'

curl -i 'http://localhost:7557/presets/mypreset' \
    -X PUT \
    --data '{ "weight": 0, "precondition": "{\"_deviceId._Manufacturer\":\"ip.access Ltd\"}", "configurations": [ { "type": "provision", "name": "myprovision" } ] }'