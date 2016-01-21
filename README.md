# Suggest Box

Decorates a textarea with GitHub-style suggestion popups (eg for emojis and users)

![Screenshot](/screenshot.png?raw=true)

## Usage: SuggestBox(textarea, suggester, options)

Suggest box is a decorator; it takes in a textarea element and binds to its events. The second param is object of options to suggest after an initial character has been typed.

```js
var textarea = document.querySelector('textarea.my-text-area')
suggestBox(textarea, suggester, {
  cls: 'my-suggest-box' // optional, extra class for the suggest-box popup
})
```

## suggestor

the `suggestor` can be a function that calls back on suggestions for each word.

``` js
function suggester (word, cb) {

  //check first char for @
  if(word[0] === '@')
    lookupUsers(word, cb)
  //else if it's an ordinary word, cb immediately.
  else cb()
}

```
the signature of the callback is `cb(err, suggestions)`
if there is an error, it will be logged.
`suggestions` is an array of suggestions. Each suggestion is of the form

``` js
{
  title: 'Bob',              // title to render
  // image: '/img/user.png', // optional, renders the image instead of the title (title still required for matching)
  // cls: 'user-option',     // optional, extra class for the option's li
  subtitle: 'Bob Roberts'    // subtitle to render
  value: '@bob'              // value to insert once selected
}
```

`value` is what will be inserted if the user makes that selection.
If you are using a sigil (say, @ at the start of user names,
the value needs to include that at the start)

Alternatively, if you already know all the possibilities,
the suggestor can be a map of sigils (prefix characters) to arrays of suggestions.
``` js
var suggester = {
  '@': [ // the initial character to watch for
    {
      title: 'Bob',              // title to render
      // image: '/img/user.png', // optional, renders the image instead of the title (title still required for matching)
      // cls: 'user-option',     // optional, extra class for the option's li
      subtitle: 'Bob Roberts'    // subtitle to render
      value: '@bob'              // value to insert once selected
    },
    ...
  ]
}

```

This example will watch for the '@' symbol and begin suggesting usernames (bob or alice).

Alternatively, if you want all inputs to trigger the suggest-box, just pass the array directly.
This is good for, for example, tag inputs:

```js
var input = document.querySelector('input.my-tags-input')
suggestBox(input, [ // trigger for any character
    {
      title: 'Bob',
      ...
    },
    ...
  ]
)
```
(this also works as 

Also, the option may be provided as an async function, this should
callback with an array of objects with this shape: `{title, subtitle?, value}`

``` js
suggestBox(textarea, {
  '@': function (word, cb) {
    getSuggestion(word, cb)
  }
})
```

## Event: suggestselect

If you want to listen for a suggest-box selection, you can attach to the 'suggestselect' event on the element. It will include the option object in the `detail`.

```js
textarea.addEventListener('suggestselect', function (e) {
  console.log(e) /* => {
    title: 'Bob',
    subtitle: 'Bob Roberts',
    value: '@bob'
  } */
})
```

## Styles

You must add your own styles to the page. Here is a some recommended styling in less:

```css
.suggest-box {
  position: fixed;
  border: 1px solid #ddd;
  z-index: 100;
  background: white;

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    li {
      padding: 4px 8px;
      font-size: 85%;
      border-bottom: 1px solid #ddd;
      &:last-child {
        border: 0;
      }
      &.selected {
        color: #fff;
        background-color: #428bca;
        border-color: darken(#428bca, 5%);
      }
      img {
        height: 20px;
      }
    }
  }
}
```

## License

MIT Licensed, Copyright 2014 Paul Frazee






