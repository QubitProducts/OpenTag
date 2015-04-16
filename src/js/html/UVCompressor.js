//:include html/html.js
//:include html/UVCommonValues.js
//:include html/Json2.js

/*jslint evil: true*/
/*global window, console, q */


(function () {
  var UVCompressor = {}, level, uv;

  // Cover for browsers without array indexOf
  var indexOfArray = function (inputArray, elt, from) {
    var len = inputArray.length;
    from = Number(arguments[2]) || 0;
    from = (from < 0) ? Math.ceil(from) : Math.floor(from);
    if (from < 0) {
      from += len;
    }
    for (; from < len; from += 1) {
      if (inputArray.hasOwnProperty(from) && inputArray[from] === elt) {
        return from;
      }
    }
    return -1;
  };

  UVCompressor.replaceCommonValues = function (subjectVariable) {
    // Iterates over universal variable replacing keynames found in UVCommon Values with
    // corresponding ID's from UVCommonValues.js
    var i = 0, ii = subjectVariable.length, returnArray = [],
      rawKeyName, keyName, returnObject = {}, keyID;

    if (subjectVariable.constructor === Array) {
      for (; i < ii; i += 1) {
        returnArray.push(UVCompressor.replaceCommonValues(subjectVariable[i]));
      }
      return returnArray;
    } else if (subjectVariable.constructor === Object) {
      for (rawKeyName in subjectVariable) {
        if (subjectVariable[rawKeyName] !== undefined &&
          subjectVariable[rawKeyName] !== null &&
          (typeof subjectVariable[rawKeyName] !== "string" ||
            subjectVariable[rawKeyName].trim().length > 0)) {
          keyName = rawKeyName.trim();
          keyID = indexOfArray(q.html.UVCommonValues.keys, keyName);
          keyName = (keyID === -1 || level === 0) ? keyName : keyID;
          returnObject[keyName] = UVCompressor
            .replaceCommonValues(subjectVariable[rawKeyName]);
        }
      }
      return returnObject;
    } else {
      if (typeof subjectVariable === "string") {
        subjectVariable = subjectVariable.trim();
      }
      return subjectVariable;
    }
  };

  UVCompressor.restoreCommonValues = function (subjectVariable) {
    var i = 0, ii = subjectVariable.length, returnArray = [],
      keyName, returnObject = {}, key;

    if (subjectVariable.constructor === Array) {
      for (; i < ii; i += 1) {
        returnArray.push(UVCompressor.restoreCommonValues(subjectVariable[i]));
      }
      return returnArray;
    } else if (subjectVariable.constructor === Object) {
      for (key in subjectVariable) {
        if (subjectVariable.hasOwnProperty(key)) {
          keyName = (isNaN(Number(key))) ? key : q.html.UVCommonValues.keys[Number(key)];
          returnObject[keyName] = UVCompressor
            .restoreCommonValues(subjectVariable[key]);
        }
      }
      return returnObject;
    } else {
      return subjectVariable;
    }

  };

  UVCompressor.compress = function (options) {
    // Level 0 - Remove empty string/ null variables
    // Level 1 - Replace keys with ids

    level = (options.compressionLevel === undefined) ? 1 : options.compressionLevel;
    uv = options.universalVariable;

    return JSON.stringify(UVCompressor.replaceCommonValues(uv));

  };

  UVCompressor.decompress = function (compressedObjectJSON) {
    var compressedObject = JSON.parse(compressedObjectJSON);
    return JSON.stringify(UVCompressor.restoreCommonValues(compressedObject));
  };

  q.html.UVCompressor = UVCompressor;

}());