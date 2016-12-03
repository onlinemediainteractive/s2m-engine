#!/usr/bin/env bash

forever --minUptime 30000 --spinSleepTime 10000 start ./forever/production.json:wq
