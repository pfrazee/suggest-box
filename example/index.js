
// to build the example, run `npm run build` then point your
// browser at ./index.html

var h = require('hyperscript')
var suggest = require('../')

var textarea = h('textarea')

document.body.appendChild(h('style', 
  '.suggest-box {position: fixed;}'
+ '.suggest-box .selected {color: red;}'
))

document.body.appendChild(textarea)

suggest(textarea, {
  '.': function (word, cb) {
      word = word.toLowerCase()
      var data = Object.keys(window)
                  .filter(function (k) {
                    return k.toLowerCase().indexOf(word) === 0
                  }).map(function (k) {
                    return {title: k, value: k}
                  })

      setTimeout(function () {
        cb(null, data)
      }, ~~(Math.random()*200))
    }
})

