# Suggest Box

Decorates a textarea with GitHub-style suggestion popups (eg for emojis and users)

![Screenshot](/screenshot.png?raw=true)

## Usage

Suggest box is a decorator; it takes in a textarea element and binds to its events. The second param is object of options to suggest after an initial character has been typed.

```js
var textarea = document.querySelector('textarea.my-text-area')
suggestBox(textarea, {
  '@': [ // the initial character to watch for
    {
      title: 'Bob',              // title to render
      // image: '/img/user.png', // optional, renders the image instead of the title (title still required for matching)
      // cls: 'user-option',     // optional, extra class for the option's li
      subtitle: 'Bob Roberts'    // subtitle to render
      value: 'bob'               // value to insert (after the initial character) once selected
    },
    {
      title: 'Alice',
      subtitle: 'Alice Allison',
      value: 'alice'
    }
  ]
}, {
  cls: 'my-suggest-box' // optional, extra class for the suggest-box popup
})
```

This example will watch for the '@' symbol and begin suggesting usernames (bob or alice).

Alternatively, if you want all inputs to trigger the suggest-box, you can use the 'any' key. This is good for, for example, tag inputs:

```js
var input = document.querySelector('input.my-tags-input')
suggestBox(input, {
  any: [ // trigger for any character
    {
      title: 'Bob',
      subtitle: 'Bob Roberts'
      value: 'bob'
    },
    {
      title: 'Alice',
      subtitle: 'Alice Allison',
      value: 'alice'
    }
  ]
})
```

Also, the option may be provided as an async function, this should
callback with an array of objects with this shape: `{title, subtitle?, value}`

``` js
suggestBox(textarea, {
  '@': function (word, cb) {
    getSuggestion(word, cb)
  }
})
```

If you want to listen for a suggest-box selection, you can attach to the 'suggestselect' event on the element. It will include the option object in the `detail`.

```js
textarea.addEventListener('suggestselect', function (e) {
  console.log(e) /* => {
    title: 'Bob',
    subtitle: 'Bob Roberts',
    value: 'bob'
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

## Acknowledgements

Uses [textarea-caret-position](https://github.com/component/textarea-caret-position), MIT Licensed, Copyright (c) 2014 Jonathan Ong me@jongleberry.com

## License

MIT Licensed, Copyright 2014 Paul Frazee
