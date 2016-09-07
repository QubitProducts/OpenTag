#!/bin/bash
current=$(dirname ${0})
echo $current
cd $current

pwd

sh scripts/compress.sh
