'use strict'
var h = require('hyperscript')
var wordBoundary = /\s/

module.exports = function(el, choices, options) {
  var box = {
    choices: choices,
    options: options || {},
    active: false,
    activate: activate,
    deactivate: deactivate,
    update: update
  }
  el.addEventListener('input', oninput.bind(box))
  el.addEventListener('keydown', onkeydown.bind(box))
  el.addEventListener('blur', onblur.bind(box))
  return box
}

function render(box) {
  var cls = (box.options.cls) ? ('.'+box.options.cls) : ''
  return h('.suggest-box'+cls, { style: { left: (box.x+'px'), top: (box.y+'px') } }, [
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
    }).filter(Boolean).slice(0, 20)
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
      var pos = textareaCaretPosition(e.target, i)
      var rects = e.target.getClientRects()
      pos.left += rects[0].left
      pos.top += rects[0].top + 20

      // setup
      self.x = pos.left
      self.y = pos.top
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

    if (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 13 || e.keyCode == 9|| e.keyCode == 27)
      e.preventDefault()

    // up
    if (e.keyCode == 38 && sel > 0) {
      this.selection = sel - 1
      this.update()
    }

    // down
    if (e.keyCode == 40 && sel < (this.filtered.length - 1)) {
      this.selection = sel + 1
      this.update()
    }

    // escape
    if (e.keyCode == 27)
      this.deactivate()

    // enter or tab
    if (e.keyCode == 13 || e.keyCode == 9) {
      if (this.filtered.length) {
        var choice = this.filtered[sel]
        if (choice && choice.value) {
          // update the text under the cursor to have the current selection's value
          var v = e.target.value
          var start = e.target.selectionStart
          var end = start
          for (start; start >= 0; start--) {
            if (v.charAt(start) in this.choices)
              break
          }
          for (end; end < v.length; end++) {
            if (wordBoundary.test(v.charAt(end)))
              break
          }
          e.target.value = v.slice(0, start + 1) + choice.value + v.slice(end)
          e.target.selectionStart = e.target.selectionEnd = start + choice.value.length + 1
          // fire the suggestselect event
          e.target.dispatchEvent(new CustomEvent('suggestselect', { detail: choice }))
        }
      }
      this.deactivate()
    }
  }
}

function onblur(e) {
  this.deactivate()
}

// https://github.com/component/textarea-caret-position
// MIT Licensed, Copyright (c) 2014 Jonathan Ong me@jongleberry.com

// The properties that we copy into a mirrored div.
// Note that some browsers, such as Firefox,
// do not concatenate properties, i.e. padding-top, bottom etc. -> padding,
// so we have to do every single property specifically.
var properties = [
  'direction',  // RTL support
  'boxSizing',
  'width',  // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  'height',
  'overflowX',
  'overflowY',  // copy the scrollbar for IE

  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',

  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',

  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',  // might not make a difference, but better be safe

  'letterSpacing',
  'wordSpacing'
];

var isFirefox = !(window.mozInnerScreenX == null);

function textareaCaretPosition(element, position) {
  // mirrored div
  var div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  var style = div.style;
  var computed = window.getComputedStyle? getComputedStyle(element) : element.currentStyle;  // currentStyle for IE < 9

  // default textarea styles
  style.whiteSpace = 'pre-wrap';
  if (element.nodeName !== 'INPUT')
    style.wordWrap = 'break-word';  // only for textarea-s

  // position off-screen
  style.position = 'absolute';  // required to return coordinates properly
  style.visibility = 'hidden';  // not 'display: none' because we want rendering

  // transfer the element's properties to the div
  for (var i=0; i < properties.length; i++) {
    var prop = properties[i]
    style[prop] = computed[prop]
  }

  if (isFirefox) {
    style.width = parseInt(computed.width) - 2 + 'px'  // Firefox adds 2 pixels to the padding - https://bugzilla.mozilla.org/show_bug.cgi?id=753662
    // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
    if (element.scrollHeight > parseInt(computed.height))
      style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden';  // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
  }  

  div.textContent = element.value.substring(0, position);
  // the second special handling for input type="text" vs textarea: spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
  if (element.nodeName === 'INPUT')
    div.textContent = div.textContent.replace(/\s/g, "\u00a0");

  var span = document.createElement('span');
  // Wrapping must be replicated *exactly*, including when a long word gets
  // onto the next line, with whitespace at the end of the line before (#7).
  // The  *only* reliable way to do that is to copy the *entire* rest of the
  // textarea's content into the <span> created at the caret position.
  // for inputs, just '.' would be enough, but why bother?
  span.textContent = element.value.substring(position) || '.';  // || because a completely empty faux span doesn't render at all
  div.appendChild(span);

  var coordinates = {
    top: span.offsetTop + parseInt(computed['borderTopWidth']),
    left: span.offsetLeft + parseInt(computed['borderLeftWidth'])
  };

  document.body.removeChild(div);

  return coordinates;
}
