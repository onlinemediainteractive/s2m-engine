#!/usr/bin/env bash

forever -m 25 --minUptime 30000 --spinSleepTime 10000 start ./forever/production.json
