#!/usr/bin/env bash

cd ~/applications
. ./s2m_eng.sh

cd ~/applications/s2m-eng-master
forever stopall
rm /home/ubuntu/.forever/s2meng.log
forever start ./forever/development.json
tail -f /home/ubuntu/.forever/s2meng.log
