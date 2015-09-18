/*jslint evil: true, browser: true, white: true, onevar: true, undef: true,
  newcap: true, nomen: false, regexp: true, plusplus: true, bitwise: true,
  maxerr: 5, maxlen: 80, indent: 2 */
/*global window */

var q = {};

q.html = {};

q.html.fileLoader = {};

/**
 * Load a file at url, optionally calling functions before and after it
 * is loaded
 * @param url The url to load
 * @param preLoadAction A function called before the url is loaded. If it
                        returns false or throws an exception it will
                        prevent the url from loading. Takes the url as
                        an argument.
 * @param postLoadHandler A function called after the url is loaded.
 *                        Takes the url as an argument.
 */
q.html.fileLoader.load = function (url, preLoadAction, postLoadHandler,
    parentNode, async) {
  var scriptEl, preLoadResult, loadError, oldOnError, doPostLoad;

  doPostLoad = function () {
    postLoadHandler(url, loadError);

    if (oldOnError) {
      window.onerror = oldOnError;
    }
  };

  try {
    if (preLoadAction) {
      preLoadResult = preLoadAction(url);
    }
  } catch (e) {
    preLoadResult = false;
  } finally {
    if (preLoadResult !== false) {
      scriptEl = q.html.fileLoader.createScriptEl(url, async);
      if (postLoadHandler) {
        scriptEl.onload = doPostLoad;
        scriptEl.onreadystatechange = function () {
          if ((this.readyState === "complete") ||
              (this.readyState === "loading")) {
            setTimeout(doPostLoad, 1);
          }
        };
      }
      if (!parentNode) {
        parentNode = window.document.getElementsByTagName("head")[0];
      }

      if (window.onerror) {
        oldOnError = window.onerror;
      }
      window.onerror = function (reason, url, lineNumber) {
        loadError = {
          reason: reason,
          url: url,
          lineNumber: lineNumber
        };
        return true;
      };

      parentNode.appendChild(scriptEl);

    }
  }
};
q.html.fileLoader.createScriptEl = function (path, async, forceReload) {
  var scriptEl = document.createElement("script");
  scriptEl.type = "text/javascript";
  scriptEl.src = q.html.fileLoader.tidyUrl(path) +
    (forceReload ? ("?" + new Date().getTime()) : "");
  if (async !== false) {
    scriptEl.async = "true";
    scriptEl.defer = "true";
  } else {
    scriptEl.async = "false";
    if (scriptEl.async !== false) {
      scriptEl.async = false;
    }
    scriptEl.defer = "false";
  }
  return scriptEl;
};

q.html.fileLoader.tidyUrl = function (path) {
  if (path.substring(0, 5) === 'http:') {
    return path;
  }
  if (path.substring(0, 6) === 'https:') {
    return path;
  }
  return "//" + path;
};
/*jslint evil: true */

q.html.GlobalEval = {};


q.html.GlobalEval.globalEval = function (src) {
  if (window.execScript) {
    window.execScript(src);
  } else {
    var fn = function () {
      window["eval"].call(window, src);
    };
    fn();
  }
};
/*global escape, unescape*/

q.html.HtmlInjector = {};

q.html.HtmlInjector.inject = function (el, injectStart, str, cb, parentNode) {
  var i, ii, d, scriptsRaw, scripts, script, contents;
  if (str.toLowerCase().indexOf("<script") >= 0) {
    d = document.createElement("div");
    d.innerHTML = "a" + str;
    scriptsRaw = d.getElementsByTagName("script");
    scripts = [];
    for (i = 0, ii = scriptsRaw.length; i < ii; i += 1) {
      scripts.push(scriptsRaw[i]);
    }
    contents = [];
    for (i = 0, ii = scripts.length; i < ii; i += 1) {
      script = scripts[i];
      if (script.src) {
        contents.push({src: script.src});
      } else {
        contents.push({script: script.innerHTML});
      }
      script.parentNode.removeChild(script);
    }
    if (d.innerHTML) {
      if (d.innerHTML.length > 0) {
        d.innerHTML = d.innerHTML.substring(1);
      }
    }
    q.html.HtmlInjector.doInject(el, injectStart, d);
    q.html.HtmlInjector.loadScripts(contents, 0, cb, el);
  } else {
    d = document.createElement("div");
    d.innerHTML = str;
    q.html.HtmlInjector.doInject(el, injectStart, d);
    if (cb) {
      cb();
    }
  }
};

q.html.HtmlInjector.doInject = function (el, injectStart, d) {
  if (d.childNodes.length > 0) {
    var fragment = document.createDocumentFragment();
    while (d.childNodes.length > 0) {
      fragment.appendChild(d.removeChild(d.childNodes[0]));
    }
    if (injectStart) {
      q.html.HtmlInjector.injectAtStart(el, fragment);
    } else {
      q.html.HtmlInjector.injectAtEnd(el, fragment);
    }
  }
};
q.html.HtmlInjector.injectAtStart = function (el, fragment) {
  if (el.childNodes.length === 0) {
    el.appendChild(fragment);
  } else {
    el.insertBefore(fragment, el.childNodes[0]);
  }

};
q.html.HtmlInjector.injectAtEnd = function (el, fragment, counter) {
  if (!counter) {
    counter = 1;
  }
  if ((el === document.body) &&
      (document.readyState !== "complete") &&
      (counter < 50)) {
    setTimeout(function () {
      q.html.HtmlInjector.injectAtEnd(el, fragment, counter + 1);
    }, 100);
  } else {
    el.appendChild(fragment);
  }
};
q.html.HtmlInjector.loadScripts = function (contents, i, cb, parentNode) {
  var ii, c;
  for (ii = contents.length; i < ii; i += 1) {
    c = contents[i];
    if (c.src) {
      q.html.fileLoader.load(
        c.src,
        null,
        function () {
          q.html.HtmlInjector.loadScripts(contents, i + 1, cb, parentNode);
        },
        parentNode
      );
      break;
    } else {
      q.html.GlobalEval.globalEval(c.script);
    }
  }
  if (cb && (i === ii)) {
    cb();
  }
};

function QTag(urlFilters, scriptLoaders, categoryFilter) {
  QTag.qTagLoaders = QTag.getLoaders(urlFilters, scriptLoaders, document.URL, categoryFilter);
  QTag.loadersFinished = 0;
  QTag.loadLoaders();
}

QTag.ALL = "1";
QTag.SUBSTRING = "2";
QTag.REGEX = "3";
QTag.EXACT_MATCH = "4";

QTag.FILTER_TYPE_INCLUDE = "1";
QTag.FILTER_TYPE_EXCLUDE = "2";

/**
 * @param urlFilter An array containing objects which have a pattern type and
 *   a filter type
 */
QTag.getLoaders = function (urlFilters, scriptLoaders, url, categoryFilter) {
  var i, ii, urlFilter, loaderKeysSet = {}, matchedFilters = [],
    loaders = [];

  if ((!urlFilters) || (!url)) {
    return loaders;
  }
  
  categoryFilter = categoryFilter || [];
  
  for (i = 0, ii = urlFilters.length; i < ii; i += 1) {
    urlFilter = urlFilters[i];
    if (QTag.doesUrlFilterMatch(urlFilter, url)) {
      matchedFilters.push(urlFilter);
    }
  }
  matchedFilters.sort(function (a, b) {
    return b.priority - a.priority;
  });
  for (i = 0, ii = matchedFilters.length; i < ii; i += 1) {
    QTag.updateLoaders(matchedFilters[i], loaderKeysSet);
  }
  for (i in loaderKeysSet) {
    if (loaderKeysSet.hasOwnProperty(i)) {
      loaders.push(scriptLoaders[i]);
    }
  }
  return loaders;
};
  /**
   * Checks to see if a url filter matches a url
   */
QTag.doesUrlFilterMatch = function (urlFilter, url) {
  var matches = false;
  switch (urlFilter.patternType) {
  case QTag.EXACT_MATCH:
    if (url.toLowerCase() === urlFilter.pattern.toLowerCase()) {
      matches = true;
    }
    break;
  case QTag.SUBSTRING:
    if (url.toLowerCase().indexOf(urlFilter.pattern.toLowerCase()) >= 0) {
      matches = true;
    }
    break;
  case QTag.REGEX:
    if (new RegExp(urlFilter.pattern).test(url)) {
      matches = true;
    }
    break;
  case QTag.ALL:
    matches = true;
    break;
  }
  return matches;
};
/**
 * Update the loader key set with the given filter
 */
QTag.updateLoaders = function (urlFilter, loaderKeysSet, categoryFilter) {
  var i, ii, scriptLoaderKeys = urlFilter.scriptLoaderKeys;
  if (urlFilter.filterType === QTag.FILTER_TYPE_INCLUDE) {
    for (i = 0, ii = scriptLoaderKeys.length; i < ii; i += 1) {
      
      var category = scriptLoaders[scriptLoaderKeys[i]].category;
      
      // add script (+) if there is no category defined or if his category matches
      if (scriptLoaderKeys.hasOwnProperty(i) && (category == undefined || categoryFilter.indexOf(category) != -1)) {
        loaderKeysSet[scriptLoaderKeys[i]] = true;
      }
    }
  } else if (urlFilter.filterType === QTag.FILTER_TYPE_EXCLUDE) {
    for (i = 0, ii = scriptLoaderKeys.length; i < ii; i += 1) {
      if (scriptLoaderKeys.hasOwnProperty(i)) {
        delete loaderKeysSet[scriptLoaderKeys[i]];
      }
    }
  }
};

QTag.waitCounts = {};
QTag.maxLoads = 10;
QTag.loadCheckInterval = 500;

QTag.loadLoaders = function () {
  var i, ii, qTagLoader, err;
  QTag.docWriteUsers = [];

  for (i = 0, ii = QTag.qTagLoaders.length; i < ii; i += 1) {
    qTagLoader = QTag.qTagLoaders[i];
    try {
      if (qTagLoader.usesDocWrite) {
        QTag.docWriteUsers.push(qTagLoader);
      } else {
        QTag.doWhenReady(qTagLoader, QTag.loadTagLoader, function () {

        });
      }
    } catch (e) {
      err = {
        reason: "error parsing loader, " + qTagLoader.id + ": " + e.reason,
        url: document.location.href
      };
      if (window.debug) {
        console.log(err);
      }
    }
  }
  QTag.loadLoadersSequentially();
};

QTag.doWhenReady = function (qTagLoader, f, timeoutHandler) {
  QTag.waitCounts[qTagLoader.id] = 0;
  QTag._doWhenReady(qTagLoader, f, timeoutHandler);
};
QTag._doWhenReady = function (qTagLoader, f, timeoutHandler) {
  if (QTag.canLoad(qTagLoader)) {
    f(qTagLoader);
  } else {
    if (QTag.waitCounts[qTagLoader.id] < QTag.maxLoads) {
      QTag.waitCounts[qTagLoader.id] += 1;
      setTimeout(function () {
        QTag._doWhenReady(qTagLoader, f, timeoutHandler);
      }, QTag.loadCheckInterval);
    } else {
      timeoutHandler(qTagLoader);
    }
  }
};
QTag.canLoad = function (qTagLoader) {
  if (qTagLoader.locationId === 2) {
    return !!document.body;
  } else if (qTagLoader.locationId === 3) {
    return !!document.getElementById(qTagLoader.locationDetail);
  }
  return true;
};
QTag.loadLoadersSequentially = function () {
  var qTagLoader, finishHandler;
  if (QTag.docWriteUsers.length > 0) {
    qTagLoader = QTag.docWriteUsers[0];
    QTag.docWriteUsers.shift();
    QTag.doWhenReady(qTagLoader, QTag.loadLoaderSequentially, function () {
      QTag.loadLoadersSequentially();
    });
  }
};
QTag.loadLoaderSequentially = function (qTagLoader) {
  var text = [];
  document.write = function (t) {
    text.push(t);
  };
  document.writeln = function (t) {
    text.push(t);
  };
  finishHandler = function () {
    var el = QTag.getLocation(qTagLoader);
    q.html.HtmlInjector.inject(el, qTagLoader.positionId === 1,
        text.join("\n"), QTag.loadLoadersSequentially);
  };
  qTagLoader.finishHandler = finishHandler;
  QTag.loadTagLoader(qTagLoader);
};
QTag.loadTagLoader = function (qTagLoader) {
  var ender = QTag.getTimerEnder(qTagLoader);
  try {
    if (qTagLoader.url) {
      q.html.fileLoader.load(
        qTagLoader.url,
        QTag.getTimerStarter(qTagLoader),
        ender,
        qTagLoader.parentNode,
        qTagLoader.async
      );
    } else if (qTagLoader.html) {
      QTag.injectHtml(qTagLoader);
    }
  } catch (e) {
    ender(null, e);
  }
};
QTag.injectHtml = function (qTagLoader) {
  var el = QTag.getLocation(qTagLoader);
  QTag.getTimerStarter(qTagLoader)();
  q.html.HtmlInjector.inject(el, qTagLoader.positionId === 1,
      qTagLoader.html, QTag.getTimerEnder(qTagLoader));
};
QTag.getLocation = function (qTagLoader) {
  var el;
  if (qTagLoader.locationId === 1) {
    el = document.getElementsByTagName("head")[0];
  } else if (qTagLoader.locationId === 2) {
    el = document.body;
  } else if (qTagLoader.locationId === 3) {
    el = document.getElementById(qTagLoader.locationDetail);
  } else {
    el = document.body;
  }
  return el;
};

QTag.getTimerStarter = function (qTagLoader) {
  return QTag.createStatementEvaluator(qTagLoader.pre);
};
QTag.getTimerEnder = function (qTagLoader) {
  return function (url, error) {
    if (qTagLoader.finishHandler) {
      qTagLoader.finishHandler();
    }
    return QTag.createStatementEvaluator(qTagLoader.post)();
  };
};

QTag.createStatementEvaluator = function (statement) {
  if ((!!statement) && (statement.length > 0)) {
    var fn, toRun = 'fn = function() {\n' +
      'q.html.GlobalEval.globalEval(statement);\n' +
      'QTag.incrementLoadCounter([]);\n' +
      '};';
    eval(toRun);
    return fn;
  } else {
    return function () {
      QTag.incrementLoadCounter([]);
    };
  }
};

QTag.incrementLoadCounter = function () {
  QTag.loadersFinished += 1;
  if (QTag.loadersFinished === QTag.qTagLoaders.length * 2) {
    if (window.qTag_allLoaded) {
      window.qTag_allLoaded();
    }
  }
};



var categoryFilter = [
        1,2,3,4
    ],
    urlFilters = [{
        filterType: '1', //Matches QTag.FILTER_TYPE_INCLUDE/EXCLUDE
        patternType: '1', //Matches QTag.ALL/SUBSTRING/REGEX/EXACT_MATCH
        pattern: "*", //Pattern for pattern type.
        priority: 1,
        scriptLoaderKeys: ['1'] //Matches keys in scriptLoader
      },
      {
        filterType: QTag.FILTER_TYPE_INCLUDE,
        patternType: QTag.SUBSTRING,
        pattern: "/my-page.html",
        priority: 1,
        scriptLoaderKeys: [
            '1'
            ,'myTag2'
        ]
    }],
    scriptLoaders = {
      '1': {
        id: '1',
        name: 'Name of the script to load',
        pre: '', //Javascript to run before the url is loaded
        url: '', //A url to load javascript from
        post: '', //Javascript to run after the url has loaded
        html: '', //If no url is specified, you can load some html through here.
        locationId: 1, //1 = HEAD, 2 = BODY, 3 = DIV
        positionId: 1, //1 = BEGINNING, 2 = HEAD
        locationDetail: '', //If specified 3 for locationId, then the id of the DIV to put the code in
        async: '', //If a url, whether the script element should be loaded asynchronously
        usesDocWrite: false //If the loaded code uses document.write
      },
      'myTag2': {
        id: 'myTag2',
        name: 'myTag2',
        pre: '', //Javascript to run before the url is loaded
        url: '', //A url to load javascript from
        post: '', //Javascript to run after the url has loaded
        html: 'myTag2 html', //If no url is specified, you can load some html through here.
        locationId: 2, //1 = HEAD, 2 = BODY, 3 = DIV
        positionId: 1, //1 = BEGINNING, 2 = HEAD
        locationDetail: '', //If specified 3 for locationId, then the id of the DIV to put the code in
        async: '', //If a url, whether the script element should be loaded asynchronously
        usesDocWrite: false, //If the loaded code uses document.write
        category: 4 // myTag2 will be loader if this id is defined into categoryFilter array
      }
    };

var qTag = new QTag(urlFilters || [], scriptLoaders || {}, categoryFilter || []);
