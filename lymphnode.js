
var http = require('http'),
    url  = require('url');
    bind = require('./util.js').bind;


function LymphNode() {
  this.handlers = [];
  this.filters = [];
	this.endingSlash = new RegExp('/$');
}

LymphNode.newServer = function(port) {
  var ln = new LymphNode();
  ln.initServer(port);
  return ln;
}


LymphNode.prototype.initServer = function(port) {
  this.server = http.createServer(bind(this.processRequest, this));
  this.server.listen(port || 7001);

  console.log("---> Server running on port: " + (port || 7000));
};

LymphNode.prototype.addFilter = function(filter) {
  this.filters.push(filter);
}

LymphNode.prototype.addHandler = function(path, handler) {
  var pathVars = [];
  var regexParts = [];
  var parts = path.split('/');
  for (var x = 1; x < parts.length; x++) {
    var part = parts[x];
    if (part.charAt(part.length-1) == ':') {
      regexParts.push('([^/]+)(?:/)');
      pathVars.push(part.substring(0, part.length-1));
    } else if (part != '') {
      regexParts.push(part + '/');
    }
  }

  console.log("---> pathRegex = /" + regexParts.join(''));
  for (var x = 0; x < pathVars.length; x++) {
    console.log('---> path var['+x+'] = ' + pathVars[x]);
  }

  var methodHandlers;
  if (handler.service) {
    var serviceDelegate = bind(handler.service, handler);
    methodHandlers = {
      get: serviceDelegate,
      post: serviceDelegate,
      put: serviceDelegate,
      del: serviceDelegate
    }
  } else {
    methodHandlers = {
      get: handler.get ? bind(handler.get, handler) : null,
      post: handler.post ? bind(handler.post, handler) : null,
      put: handler.post ? bind(handler.put, handler) : null,
      del: handler.post ? bind(handler.del, handler) : null
    }
  }

  this.handlers.push({
    methodHandlers: methodHandlers,
    pathRegex: new RegExp('^/' + regexParts.join('') + '$'),
    pathVars: pathVars
  });
};

LymphNode.prototype.service = function(path, func) {
  this.addHandler(path, {service: func});
};

LymphNode.prototype.get = function(path, func) {
  this.addHandler(path, {get: func});
};

LymphNode.prototype.post = function(path, func) {
  this.addHandler(path, {post: func});
};

LymphNode.prototype.put = function(path, func) {
  this.addHandler(path, {put: func});
};

LymphNode.prototype.del = function(path, func) {
  this.addHandler(path, {del: func});
};

LymphNode.prototype.findHandler = function(urlObj) {
  var length = this.handlers.length;
  for (var x = 0; x < length; x++) {
    var handler = this.handlers[x];
    var match = handler.pathRegex.exec(urlObj.pathname);
    if (match) {
      console.log("---> found match for path = " + urlObj.pathname +
                  ' pathRegex = ' + handler.pathRegex);
      var pathVars = handler.pathVars;
      var reqVars = urlObj.query || {};
      for (var y = 0; y < pathVars.length; y++) {
        console.log("---> match["+(y+1)+"] = " + match[y+1]);
	      reqVars[pathVars[y]] = match[y+1];
      }

      return {
        reqVars: reqVars,
	      methodHandlers: handler.methodHandlers
      };
    }
  }
};

LymphNode.prototype.processRequest = function(req, res) {
  var urlObj = url.parse(req.url, true);
	if (!this.endingSlash.test(urlObj.pathname)) {
		urlObj.pathname = urlObj.pathname + '/';
	}

  //TODO: call any filters

  var handlerAndVars = this.findHandler(urlObj);
  if (!handlerAndVars) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end("Didn't find a handler match for path = " + urlObj.pathname);
    return;
  } else if (req.method == 'GET' && handlerAndVars.methodHandlers.get) {
    handlerAndVars.methodHandlers.get(req, res, handlerAndVars.reqVars);
  } else if (req.method == 'POST' && handlerAndVars.methodHandlers.post) {
    //TODO: process post params and pass into post as part of the reqVars
    handlerAndVars.methodHandlers.post(req, res, handlerAndVars.reqVars);
  } else if (req.method == 'PUT' && handlerAndVars.methodHandlers.put) {
    handlerAndVars.methodHandlers.put(req, res, handlerAndVars.reqVars);
  } else if (req.method == 'DELETE' && handlerAndVars.methodHandlers.del) {
    handlerAndVars.methodHandlers.del(req, res, handlerAndVars.reqVars);
  } else {
    //TODO: return error code of unsupported op
  }
};

exports.LymphNode = LymphNode;
