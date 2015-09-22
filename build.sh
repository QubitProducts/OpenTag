#!/bin/bash
current=$(dirname ${0})
echo $current
cd $current

pwd

#fail if failed function 
exitOnError(){
  errorCode="$?";
  if [ $errorCode -ne "0" ]; then
    echo "running failed, error code:" $errorCode
    if [[ -n $1 ]]; then
      echo $1
    fi
    exit 1
  fi
}

#source scripts...

DEBUGSCRIPT=""
LOCAL="//= require,//:include,//:import,//:css"
LOG="/*L*/,log.FINE(,log.INFO(,log.FINEST(,log.ERROR(,log.WARN(,//L,Log(,qubit.opentag.Log"
TEST="/*~tests*/"
NEVER="/*~NEVER INCLUDE*/,/*~TRASH*/"
SESSION="//:session"
PURE=",/*NO LOG*/,/*NO EXTRAS-disabled*/"
COMMON=" --keep-lines"

mkdir build

echo ">>> IN DIRECTORY: " `pwd`
echo "Changing dir to:" $(pwd)
echo "Running concat/merge."
echo "Generating main.js file..."


#merge js
java -jar bin/compilejs.jar --info \
 -v \
 -dl "$LOCAL" \
 -dw "/**~ TRASH **/,$NEVER"\
 -df "/* exclude from merge */,/** EXCLUDE FROM NEW API **/,/*NO CONSENT COOKIE*/"\
 -o build/tagsdk.o \
 -i .js \
 -s src/js \
 --source-base src/js  $COMMON

exitOnError

echo "(function () {\n" > build/tagsdk.js
cat build/tagsdk.o.js >> build/tagsdk.js
echo "\n}());" >> build/tagsdk.js
rm -vf build/tagsdk.o.js

echo "Compressing build/tagsdk.js ..."
java -jar bin/yuicompressor-2.4.jar build/tagsdk.js -o build/tmp.js
exitOnError

java -jar bin/compiler.jar \
  --js build/tmp.js \
  --js_output_file build/tagsdk-compressed.js \
  --compilation_level SIMPLE\
  --summary_detail_level 1\
  --warning_level QUIET
exitOnError

rm build/tmp.js

echo "Ready."

