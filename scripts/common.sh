#!/bin/bash
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