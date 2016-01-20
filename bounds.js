
function whitespace (s) {
  return /\S/.test(s)
}

exports.START = exports.END = -1

var start = exports.start = function (text, i, bound) {
  var s = i, S = -1
  while(s >= 0 && bound(text[s])) S = s--
  return exports.START = S
}

var end = exports.end = function (text, i, bound) {
  var s = i, S = -1
  while(s < text.length && bound(text[s])) S = ++s
  return exports.END = S
}

var word = exports.word = function (text, i, bound) {
  bound = bound || whitespace
  return text.substring(start(text, i, bound), end(text, i, bound))
}

exports.replace = function replace (value, text, i, bound) {
  bound = bound || whitespace

  var w = word(text, i, bound)
  if(!w) return text

  return (
    text.substring(0, exports.START)
  + value
  + text.substring(exports.END)
  )
}

