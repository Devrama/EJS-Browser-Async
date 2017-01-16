# EJS extension for asynchronous template load

* Load EJS template files asynchronously in browser.
* `include` support in browser, and it loads included templates recursively.

## Example
Example code is located in `/example` directory.

## How to use

### First, load EJS and this extension in your HTNL page.
```html
  <script src="ejs-2.4.2.min.js" type="text/javascript"></script>
  <script src="ejs-browser-async.min.js" type="text/javascript"></script>
```

### API

### ejs.renderAsync(path, data, callback)
* **path**: relative to the page, or absolute path of the ejs template file
* **data**: parameters that you want to pass to the templates
* **callback**: callback function that gives you rendered string. callback has two arguments, `error` and `rendered`. 
    * **error**: Error object if error occurs, otherwise null.
    * **rendered**: Rendered string result.

#### Example code of ejs.renderAsync
```javascript
  ejs.renderAsync(
    './templates/index.ejs',
    {
      sitename: 'EJS Async',
      copyright: 'Devrama.com'
    },
    function(err, rendered){
      if(!err){
        var el = document.getElementById('ejs-render');
        el.innerHTML = rendered;
      }
      else {
        throw new Error('EJS template error!');
      }
    }
  );
```

# License
MIT
