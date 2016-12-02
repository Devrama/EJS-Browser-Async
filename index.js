var ejs = require('ejs'),
  path = require('path'),
  async = require('async');

var renderExtended = ejs;

function addEjsExtension(viewPath){
  return path.extname(viewPath) === '.ejs' ? viewPath : viewPath + '.ejs';
}

function getTemplateText(url, success, fail) {
  var request = new XMLHttpRequest();
  request.open("GET", addEjsExtension(url));
  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if (request.status >= 200 && request.status < 400) {
        //var type = request.getResponseHeader("Content-Type");
        //if (type.match(/^text/))
          success(request.responseText);
      }
      else {
        fail(request.statusText);
      }
    }
  };
  request.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
  request.send(null);
}

renderExtended.renderSmart = function(view, data, callback) {
  //Running on node.js
  if (typeof window == 'undefined') {
    renderInNode(view.server, data, callback);
  } else {
    this.renderAsync(view.client, data, callback);

  }
};


renderExtended.renderAsync = function(view, data, callback) {
  getAllTemplateFileList(view, data, function(err, pathData) {
    if(!err){
      var rendered = renderIncludeRecursive(view, data, pathData);
      callback(null, rendered);
    }
    else {
      callback(err, null);
    }

  });
};

function renderInNode(view, data, callback) {
  ejs.renderFile(
    addEjsExtension(view),
    data,
    function(err, result) {
      callback(err, result);
    }
  );
}

function getEjsTextFromPathData(templateData, filePath) {
  for(var key in templateData){
    if(templateData[key].filePath == filePath){
      return templateData[key].templateText;
    }
  }
}

function renderIncludeRecursive(view, data, templateData) {
  var ejsText = getEjsTextFromPathData(templateData, view);

  var fn = ejs.compile(
    ejsText, {
      client: true,
      filename: view
    }
  );

  var includeFilePaths = [];
  var rendered = fn(data, null, function(includeFilePath, includeData) {
    return renderIncludeRecursive(path.join(path.dirname(view), includeFilePath), includeData, templateData);
  });

  return rendered;
}

function getAllTemplateFileList(view, data, callback) {
  var returnPathsData = [];
  var currentPathData = {
    filePath: view,
    data: data,
    templateText: null
  };

  getTemplateText(
    view,
    function success(ejsText) {
      currentPathData.templateText = ejsText;
      returnPathsData.push(currentPathData);

      var fn = ejs.compile(
        ejsText, {
          client: true,
          filename: view
        }
      );

      var includeFilePaths = [];
      fn(data, null, function(includeFilePath, includeData) {
        includeFilePaths.push({
          filePath: includeFilePath,
          data: includeData
        });
      });


      if (includeFilePaths.length > 0) {
        var createAsyncFunc = function(filePath, data) {
          return function(callback) {
            getAllTemplateFileList(path.join(path.dirname(view), filePath), data, function(err, pathData) {
              callback(err, pathData);
            });
          };
        };

        var funcs = {};

        includeFilePaths.forEach(function(pathData, index) {
          funcs['data' + index] = createAsyncFunc(pathData.filePath, pathData.data);
        });

        async.parallel(
          funcs,
          function(err, result) {
            if (err) {
              callback(err, null);
            } else {
              var pathDataFromChild = [];
              for (var key in result) {
                result[key].forEach(function(obj) {
                  returnPathsData.push(obj);
                });
              }

              callback(null, returnPathsData);
            }

          }
        );
      } else {
        callback(null, returnPathsData);
      }

    },
    function fail(statusText){
      callback(new Error(statusText), returnPathsData);
    }
  );

}

module.exports = renderExtended;
