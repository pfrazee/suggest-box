'use strict'
var h = require('hyperscript')
var wordBoundary = /\s/
var bounds = require('./bounds')

var TextareaCaretPosition = require('textarea-caret-position')

var Suggester = require('./suggester')

module.exports = function(el, choices, options) {

  var tcp = new TextareaCaretPosition(el)

  var suggest = Suggester(choices)

  var box = {
    choices: choices,
    options: options || {},
    active: false,
    activate: activate,
    deactivate: deactivate,
    selection: 0,
    filtered: [],

    //get the current word
    get: function (i) {
      i = Number.isInteger(i) ? i : el.selectionStart - 1
      return bounds.word(el.value, i)
    },

    //replace the current word
    set: function (w, i) {
      i = Number.isInteger(i) ? i : el.selectionStart - 1
      el.value = bounds.replace(w, el.value + ' ', i)
      el.selectionStart = el.selectionEnd = bounds.START + w.length + 1
    },

    select: function (n) {
      this.selection = Math.max(0, Math.min(this.filtered.length, n))
      this.update()
    },
    next: function () {
      this.select(this.selection + 1)
    },
    prev: function () {
      this.select(this.selection - 1)
    },
    update: update,
    enter: function (n) {
      if(!isNaN(n)) this.select(n)
      if (this.filtered.length) {
        var choice = this.filtered[this.selection]
        if (choice && choice.value) {
          // update the text under the cursor to have the current selection's value          var v = el.value
          this.set(choice.value)
          // fire the suggestselect event
          el.dispatchEvent(new CustomEvent('suggestselect', { detail: choice }))
        }
      }
      this.deactivate()
    },
    suggest: function (cb) {
      var choices, self = this
      // extract current word
      var word = this.get()
      if(!word)
        return this.deactivate(), cb()

      // filter and order the list by the current word
      this.selection = 0

      var r = this.request = (this.request || 0) + 1
      suggest(word, function (err, choices) {
        if(err) return console.error(err)
        if(r !== self.request) return cb()
        if(choices) cb(null, self.filtered = choices)
      })

    },
    reposition: function () {
      self = this
      if (self.filtered.length == 0)
        return self.deactivate()

      // create / update the element
      if (self.active) {
        self.update()
      } else {
        // calculate position
        var pos = tcp.get(el.selectionStart, el.selectionEnd)

        var bounds = el.getBoundingClientRect()
        // setup
        self.x = pos.left + bounds.left - el.scrollLeft
        self.y = pos.top + bounds.top - el.scrollTop + 20
        self.activate()
      }
    }
  }
  el.addEventListener('input', oninput.bind(box))
  el.addEventListener('keydown', onkeydown.bind(box))
  el.addEventListener('blur', onblur.bind(box))
  return box
}

function render(box) {
  var cls = (box.options.cls) ? ('.'+box.options.cls) : ''
  return h('.suggest-box'+cls, { style: { left: (box.x+'px'), top: (box.y+'px'), position: 'fixed' } }, [
    h('ul', renderOpts(box))
  ])
}

function renderOpts(box) {
  var fragment = document.createDocumentFragment()
  for (var i=0; i < box.filtered.length; i++) {
    var opt = box.filtered[i]
    var tag = 'li'
    if (i === box.selection) tag += '.selected'
    if (opt.cls) tag += '.' + opt.cls
    var title = opt.image ? h('img', { src: opt.image }) : h('strong', opt.title)
    fragment.appendChild(h(tag, [title, ' ', opt.subtitle && h('small', opt.subtitle)]))
  }
  return fragment
}

function activate() {
  if (this.active)
    return
  this.active = true
  this.el = render(this)
  document.body.appendChild(this.el)
}

function update() {
  if (!this.active)
    return
  var ul = this.el.querySelector('ul')
  ul.innerHTML = ''
  ul.appendChild(renderOpts(this))
}

function deactivate() {
  if (!this.active)
    return
  this.el.parentNode.removeChild(this.el)
  this.el = null
  this.active = false
}

function oninput(e) {
  var self = this
  var word = this.suggest(function (_, suggestions) {
    console.log('SUG', _, suggestions)
    if(suggestions) self.reposition()
  })
}

function onkeydown(e) {
  if (this.active) {
    // up
    if (e.keyCode == 38) this.prev()
    // down
    else if (e.keyCode == 40) this.next()
    // escape
    else if (e.keyCode == 27) this.deactivate()
    // enter or tab
    else if (e.keyCode == 13 || e.keyCode == 9) this.enter()
    else
      return //ordinary key, fall back.

    e.preventDefault() //movement key, as above.
  }
}

function onblur(e) {
  this.deactivate()
}

