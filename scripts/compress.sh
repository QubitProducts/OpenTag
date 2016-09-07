#!/bin/bash
current=$(dirname ${0})
echo $current
cd $current/..
echo "Changing dir to:" $(pwd)
. scripts/common.sh

sh scripts/merge.sh
exitOnError 

echo "Compressing files..."

echo "... 1 build/tagsdk-current.js"
java -jar bin/yuicompressor-2.4.jar build/tagsdk-current.js -o build/y.tagsdk-current-compressed.js
exitOnError
java -jar bin/compiler.jar \
  --js build/y.tagsdk-current-compressed.js \
  --js_output_file build/tagsdk-current-compressed.js \
  --compilation_level SIMPLE\
  --summary_detail_level 1\
  --warning_level QUIET
exitOnError
rm build/y.tagsdk-current-compressed.js

echo "... 2 build/tagsdk-current.clean.js"
java -jar bin/yuicompressor-2.4.jar build/tagsdk-current.clean.js -o build/y.tagsdk-current.clean.js
exitOnError
java -jar bin/compiler.jar \
  --js build/y.tagsdk-current.clean.js \
  --js_output_file build/tagsdk-current.clean.compressed.js \
  --compilation_level SIMPLE\
  --summary_detail_level 1\
  --warning_level QUIET
exitOnError
rm build/y.tagsdk-current.clean.js

#echo "Gzipping..."
#gzip build/main-compr.js

echo "Ready.\nDirectory listing[build/]: \n\n *************************************************"
ls -hlFG build/
exitOnError

echo "\n *************************************************"



