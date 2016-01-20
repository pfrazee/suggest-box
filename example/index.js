
// to build the example, run `npm run build` then point your
// browser at ./index.html

var h = require('hyperscript')
var suggest = require('../')

var textarea = TA = h('textarea', {rows: 60, columns: 20})

document.body.appendChild(h('style',
  '.suggest-box .selected {color: red;}'
))

document.body.appendChild(h('div',
  h('h1', 'suggestbox test'),
  textarea,
  h('p',
    'type into the text area, and when you type "."',
    'an autosuggest for DOM properties will be created'
  )
))

suggest(textarea, {
  '.': function (word, cb) {
      word = word.toLowerCase()
      var data = Object.keys(window)
                  .filter(function (k) {
                    return k.toLowerCase().indexOf(word) === 0
                  }).map(function (k) {
                    return {title: k, value: '.'+k}
                  })

      setTimeout(function () {
        cb(null, data)
      }, ~~(Math.random()*200))
    }
})


