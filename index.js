'use strict'
var h = require('hyperscript')
var wordBoundary = /\s/

var TextareaCaretPosition = require('textarea-caret-position')

module.exports = function(el, choices, options) {
  var box = {
    input: el,
    choices: choices,
    options: options || {},
    active: false,
    activate: activate,
    deactivate: deactivate,
    update: update,
    complete: complete,
  }
  el.addEventListener('input', oninput.bind(box))
  el.addEventListener('keydown', onkeydown.bind(box))
  el.addEventListener('blur', onblur.bind(box))
  return box
}

function getItemIndex(e) {
  for (var el = e.target; el && el != this; el = el.parentNode)
    if (el._i != null)
      return el._i
}

function onListMouseMove(e) {
  this._box.isMouseActive = true
}

function onListMouseOver(e) {
  // ignore mouseover triggered by list redrawn under the cursor
  if (!this._box.isMouseActive) return

  var i = getItemIndex(e)
  if (i != null && i != this._box.selection) {
    this._box.selection = i
    this._box.update()
  }
}

function onListMouseDown(e) {
  var i = getItemIndex(e)
  if (i != null) {
    this._box.selection = i
    this._box.complete()
    // prevent blur
    e.preventDefault()
  }
}

function render(box) {
  var cls = (box.options.cls) ? ('.'+box.options.cls) : ''
  return h('.suggest-box'+cls, { style: { left: (box.x+'px'), top: (box.y+'px'), position: 'fixed' } }, [
    h('ul', {
      _box: box,
      onmousemove: onListMouseMove,
      onmouseover: onListMouseOver,
      onmousedown: onListMouseDown
    }, renderOpts(box))
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
    fragment.appendChild(h(tag, {_i: i}, [title, ' ', opt.subtitle && h('small', opt.subtitle)]))
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
  var choices
  var self = this

  // are we in a word that starts with one of the starting characters?
  var isany = false
  var v = e.target.value
  var i = e.target.selectionStart - 1
  // seek backwards from the cursor
  for (i; i >= 0; i--) {
    var c = v.charAt(i)
    // hit a word boundary?
    if (wordBoundary.test(c))
      return this.deactivate()
    // hit a starting character?
    if ((c in this.choices || this.choices.any) && (i === 0 || wordBoundary.test(v.charAt(i - 1)))) {
      choices = this.choices[c] || this.choices.any
      if (choices == this.choices.any)
        isany = true
      break
    }
  }
  // no hit?
  if (i < 0)
    return this.deactivate()

  // extract current word
  var word = v.slice(i+(isany?0:1), e.target.selectionStart)
  if(!word)
    return this.deactivate()

  // filter and order the list by the current word
  this.selection = 0

  //request data for this query.

  if(Array.isArray(choices)) {
    var wordRe = new RegExp(word.replace(/\W/g, ''), 'i')
    this.filtered = choices.map(function (opt, i) {
      var title = wordRe.exec(opt.title)
      var subtitle = opt.subtitle ? wordRe.exec(opt.subtitle) : null
      var rank = (title === null ? (subtitle&&subtitle.index) : (subtitle === null ? (title&&title.index) : Math.min(title.index, subtitle.index)))
      if (rank !== null) {
        opt.rank = rank
        return opt
      }
    }).filter(Boolean).sort(compare).slice(0, 20)
    next()
  }
  else if('function'  === typeof choices) {
    var r = this.request = (this.request || 0) + 1
    choices(word, function (err, ary) {
      //if there has been another request since this was made
      //but they came back in another order, just drop this one.
      if(r != self.request) return
      if(err) console.error(err)
      else self.filtered = ary
      next()
    })
  }

  function next () {
    // cancel if there's nothing available
    if (self.filtered.length == 0)
      return self.deactivate()

    // create / update the element
    if (self.active) {
      self.update()
    } else {
      // calculate position
      var pos = new TextareaCaretPosition(e.target)
        .get(e.target.selectionStart, e.target.selectionEnd)

      var bounds = e.target.getBoundingClientRect()
      // setup
      self.x = pos.left + bounds.left - e.target.scrollLeft
      self.y = pos.top + bounds.top - e.target.scrollTop + 20
      self.activate()
    }
  }

}


function compare(a, b) {
  return compareval(a.rank, b.rank) || compareval(a.title, b.title)
}

function compareval(a, b) {
  return a === b ? 0 : a < b ? -1 : 1
}

function onkeydown(e) {
  if (this.active) {
    var sel = this.selection
    var len = this.filtered.length

    if (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13 || e.keyCode == 9|| e.keyCode == 27)
      e.preventDefault()

    // up
    if (e.keyCode == 38) {
      this.selection = (sel - 1 + len) % len
      this.update()
    }

    // down
    if (e.keyCode == 40) {
      this.selection = (sel + 1) % len
      this.update()
    }

    // escape
    if (e.keyCode == 27)
      this.deactivate()

    // enter or tab
    if (e.keyCode == 13 || e.keyCode == 9) {
      this.complete()
    }

    this.isMouseActive = false
  }
}

function onblur(e) {
  this.deactivate()
}

function complete() {
  var choice = this.filtered[this.selection]
  if (choice && choice.value) {
    // update the text under the cursor to have the current selection's value
    var v = this.input.value
    var start = this.input.selectionStart
    var end = start
    for (start; start >= 0; start--) {
      if (v.charAt(start) in this.choices)
        break
    }
    for (end; end < v.length; end++) {
      if (wordBoundary.test(v.charAt(end)))
        break
    }
    this.input.value = v.slice(0, start + 1) + choice.value + v.slice(end)
    this.input.selectionStart = this.input.selectionEnd = start + choice.value.length + 1
    // fire the suggestselect event
    this.input.dispatchEvent(new CustomEvent('suggestselect', { detail: choice }))
  }
  this.deactivate()
}
