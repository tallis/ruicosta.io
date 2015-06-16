var express = require('express'),
    exphbs  = require('express-handlebars');
var path = require('path');

var app = express();
var port = parseInt(process.argv[2])

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('index');
});

app.listen(port);
