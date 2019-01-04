#!/usr/bin/env bash

pushd /home/acs/genieacs

su acs -c 'npm i; npm i ini'

systemctl start genieacs-cwmp genieacs-nbi

sleep 5

curl -i 'http://localhost:7557/provisions/myprovision' \
    -X PUT \
    --data '@/home/acs/provision.js'

curl -i 'http://localhost:7557/presets/ip_access_preset' \
    -X PUT \
    --data '{ "weight": 0, "precondition": "{\"_deviceId._Manufacturer\":\"ip.access Ltd\"}", "configurations": [ { "type": "provision", "name": "myprovision" } ] }'

systemctl stop genieacs-cwmp genieacs-nbi

popd
