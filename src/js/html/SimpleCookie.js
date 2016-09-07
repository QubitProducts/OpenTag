//= require <html/html>
/* exclude from merge */
/*global escape, unescape*/
/*
// MOVED TO QUBIT PACKAGE. To be deleted. Excluded.
q.html.simplecookie = {};

q.html.simplecookie.readCookie = function (name, noescp) {
  var r, cookie, value, cookies, nameSearchString, i, ii;
  nameSearchString = name + "=";
  cookies = document.cookie.split(';');
  r = /^\s+|\s+$/g;
  for (i = 0, ii = cookies.length; i < ii; i += 1) {
    cookie = cookies[i].replace(r, '');// trim
    if (cookie.indexOf(nameSearchString) === 0) {
      if (noescp) {
        value = cookie.substring(nameSearchString.length);
      } else {
        value = unescape(cookie.substring(nameSearchString.length));
      }
      if (value.length === 0) {
        return null;
      }
      return value;
    }
  }
  return null;
};
q.html.simplecookie.readAllCookies = function (name, noescp) {
  var r, cookie, value, cookies, nameSearchString, i, ii, values;
  nameSearchString = name + "=";
  cookies = document.cookie.split(';');
  r = /^\s+|\s+$/g;
  values = [];
  for (i = 0, ii = cookies.length; i < ii; i += 1) {
    cookie = cookies[i].replace(r, '');
    if (cookie.indexOf(nameSearchString) === 0) {
      if (noescp) {
        value = cookie.substring(nameSearchString.length);
      } else {
        value = unescape(cookie.substring(nameSearchString.length));
      }
      if (value.length > 0) {
        values.push(value);
      }
    }
  }
  return values;
};
q.html.simplecookie.writeCookie = function (name, value, days, domain, noescp) {
  var date, expires, cookie;
  if (days) {
    date = new Date();
    date.setTime(date.getTime() + (days * 86400000));
    expires = "; expires=" + date.toGMTString();
  } else {
    expires = "";
  }
  if (noescp) {
    cookie = name + "=" + value + expires + "; path=/;";
  } else {
    cookie = escape(name) + "=" + escape(value) + expires + "; path=/;";
  }
  if (domain) {
    cookie += " domain=" + domain;
  }
  document.cookie = cookie;
};
*/