
function isObject (o) {
  return o && 'object' === typeof o
}

var isArray = Array.isArray

function isFunction (f) {
  return 'function' === typeof f
}

function compare(a, b) {
  return compareval(a.rank, b.rank) || compareval(a.title, b.title)
}

function compareval(a, b) {
  return a === b ? 0 : a < b ? -1 : 1
}

function suggestWord (word, choices, cb) {
  if(isArray(choices)) {
    //remove any non word characters and make case insensitive.
    var wordRe = new RegExp(word.replace(/\W/g, ''), 'i')
    cb(null, choices.map(function (opt, i) {
      var title = wordRe.exec(opt.title)
      var subtitle = opt.subtitle ? wordRe.exec(opt.subtitle) : null
      var rank = (title === null ? (subtitle&&subtitle.index) : (subtitle === null ? (title&&title.index) : Math.min(title.index, subtitle.index)))
      if (rank !== null) {
        opt.rank = rank
        return opt
      }
    }).filter(Boolean).sort(compare).slice(0, 20))
  }
  else if(isFunction(choices)) choices(word, cb)
}

module.exports = function (choices) {
  if(isFunction(choices)) return choices

  else if(isObject(choices) && (choices.any || isArray(choices)))
    return function (word, cb) {
      suggestWord(word, choices.any || choices, cb)
    }
  else if(isObject(choices)) {
    var _choices = choices
    //legacy
    return function (word, cb) {
      if(!choices[word[0]]) return cb()
      suggestWord(word.substring(1), choices[word[0]], cb)
    }
  }
}












