#!/bin/bash
current=$(dirname ${0})
echo $current
cd $current

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
LOCAL="//= require,//:include"
LOG="/*L*/,log.FINE(,log.INFO(,log.FINEST(,log.ERROR(,log.WARN(,//L,Log(,qubit.opentag.Log"
TEST="/*~tests*/"
NEVER="/*~NEVER INCLUDE*/,/*~TRASH*/"
SESSION="//:session"
PURE=",/*NO LOG*/,/*NO EXTRAS-disabled*/"

mkdir build

echo ">>> IN DIRECTORY: " `pwd`
echo "Changing dir to:" $(pwd)
echo "Running concat/merge."
echo "Generating main.js file..."


#merge js
java -jar bin/MiniMerge.jar --info \
  -v \
  -dl "/*D*/,$LOCAL,$LOG,$DEBUGSCRIPT" \
  -dw "/*~debug*/,/*~log*/,$TEST,$NEVER,/**~ TRASH **/"\
  -df "/* exclude from merge */,$PURE,/** EXCLUDE FROM NEW API **/,/*NO CONSENT COOKIE*/"\
  -o build/tagsdk.js \
  -i .js\
  -s src/js/qubit\
  --source-base src/js/
exitOnError

cat src/templates/prefix > out.tmp
cat build/tagsdk.js >> out.tmp
cat src/templates/suffix >> out.tmp
cp -f out.tmp build/tagsdk.js

#merge js
java -jar bin/MiniMerge.jar --info \
  -v \
  -dl "$LOCAL" \
  -dw "/**~ TRASH **/,$NEVER"\
  -df "/* exclude from merge */,/** EXCLUDE FROM NEW API **/,/*NO CONSENT COOKIE*/"\
  -o build/tagsdk-debug.js \
  -i .js\
  -s src/js/qubit\
  --source-base src/js/
exitOnError

cat src/templates/prefix > out.tmp
cat build/tagsdk-debug.js >> out.tmp
cat src/templates/suffix >> out.tmp
cp -f out.tmp build/tagsdk-debug.js

rm -f out.tmp

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


echo "Compressing build/tagsdk-debug.js ..."
java -jar bin/yuicompressor-2.4.jar build/tagsdk-debug.js -o build/tmp.js
exitOnError
java -jar bin/compiler.jar \
  --js build/tmp.js \
  --js_output_file build/tagsdk-debug-compressed.js \
  --compilation_level SIMPLE\
  --summary_detail_level 1\
  --warning_level QUIET
exitOnError
rm build/tmp.js

echo "Ready."

