/*EXCLUDE: SESSION*/
//:include cookie/cookie.js
//:include qubit/Cookie.js

q.cookie.SimpleSessionCounter = {};
//Qubit Session Tracker
q.cookie.SimpleSessionCounter._cookieName = "_qst_s";
q.cookie.SimpleSessionCounter._sessionCookie = "_qsst_s";
q.cookie.SimpleSessionCounter.update = function (domain) {
  var c, s, ga, mins = 30;
  c = qubit.Cookie.get(q.cookie.SimpleSessionCounter._cookieName);
  s = qubit.Cookie.get(q.cookie.SimpleSessionCounter._sessionCookie);
  if (!c) {
    c = 1;
  } else {
    c = parseInt(c, 10);
    if (!s || (parseInt(s, 10) < (new Date().getTime() - mins * 60 * 1000))) {
      c += 1;
    }
  }
  qubit.Cookie.set(q.cookie.SimpleSessionCounter._cookieName, c, 365, domain);
  qubit.Cookie.set(q.cookie.SimpleSessionCounter._sessionCookie, 
    new Date().getTime().toString(), null, domain);
  return c;
};
