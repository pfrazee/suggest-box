

//find a word at a given index in a string.

var bounds = require('../bounds')

var tape = require('tape')

var text = 'foo bar baz TestThing wordz'

tape('select a word at a bound', function (t) {

  function test(i) {
    return bounds.word(text, i)
  }

  t.equal(test(0), 'foo')
  t.equal(test(1), 'foo')
  t.equal(test(2), 'foo')

  t.equal(test(4), 'bar')
  t.equal(test(5), 'bar')
  t.equal(test(6), 'bar')

  t.equal(test(15), 'TestThing')

  t.equal(test(22), 'wordz')

  t.equal(test(3), '')
  t.equal(test(7), '')

  t.end()
})

tape('replace a word', function (t) {
  t.equal(bounds.replace('FOO', text, 1), 'FOO bar baz TestThing wordz')
  t.end()
})



