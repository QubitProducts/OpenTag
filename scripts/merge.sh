#!/bin/bash
current=$(dirname ${0})
echo $current
cd $current/..
. scripts/common.sh
#source scripts...

DEBUGSCRIPT=""
LOCAL="//= require,//:include,//:import,//:css"
LOG="/*L*/,//L"
TEST="/*~tests*/"
NEVER="/*~NEVER INCLUDE*/,/*~TRASH*/"
SESSION="//:session"
PURE=",/*NO LOG*/,/*NO EXTRAS-disabled*/"
COMMON=" --keep-lines"
SRC_BASE="src/js/,lib/"

echo ">>> IN DIRECTORY: " `pwd`
echo "Changing dir to:" $(pwd)
echo "Running concat/merge."
echo "Generating main.js file..."

mkdir -p build
exitOnError

#merge js
java -jar bin/compilejs.jar --info \
  -v \
  -dl "$LOCAL" \
  -dw "/**~ TRASH **/,$NEVER"\
  -df "/* exclude from merge */,/** EXCLUDE FROM NEW API **/,/*NO CONSENT COOKIE*/"\
  -o build/tagsdk-current.o \
  -i .js\
  -s src/js/qubit/opentag\
  --source-base $SRC_BASE   $COMMON

exitOnError

#merge js non debug
java -jar bin/compilejs.jar --info \
  -v \
  -dl "$LOCAL,/*D*/,/*L*/,//= require,//:include,//:import,//:css" \
  -dw "/**~ TRASH **/,$NEVER,/*~debug*/,/*~log*/"\
  -df "/* exclude from merge */,/*~NEVER INCLUDE*/,/*~TRASH*/,/* exclude from merge */,/** EXCLUDE FROM NEW API **/,/*NO CONSENT COOKIE*/"\
  -o build/tagsdk-current.clean.o \
  -i .js\
  -s src/js/qubit/opentag\
  --source-base $SRC_BASE   $COMMON

exitOnError

echo "(function () {" > build/tagsdk-current.js
cat build/tagsdk-current.o.js >> build/tagsdk-current.js
echo "}());" >> build/tagsdk-current.js
rm -f build/tagsdk-current.o.js

echo "(function () {" > build/tagsdk-current.clean.js
cat build/tagsdk-current.clean.o.js >> build/tagsdk-current.clean.js
echo "}());" >> build/tagsdk-current.clean.js
rm -f build/tagsdk-current.clean.o.js


