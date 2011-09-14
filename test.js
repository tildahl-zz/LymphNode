var ln = require("./lymphnode.js").LymphNode.newServer();


ln.get("/test/first:/last:", function(req, res, vars) {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.write("Hello User " + vars.first + " " + vars.last);
  res.end();
});

ln.get("/test/two/first:/last:", function(req, res, vars) {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.write("Hello User Two " + vars.first + " " + vars.last);
  res.end();
});
