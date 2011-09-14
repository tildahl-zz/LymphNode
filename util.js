

function bind(func, scope) {
  var args = arguments;
  return function() {
	  //TODO join args and arguments
	  func.apply(scope, arguments);
  }
}

exports.bind = bind;
