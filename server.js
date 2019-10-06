'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
const urlControler = require('./urlController');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose
  .connect(process.env.MONGOLAB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));


app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// ... what to do when the user submits/POSTs (our submit button is set to POST) a new long-form URL...
app.post("/api/shorturl/new", urlControler.postLongUrl);

// ... and what to do when a short-url is targeted...
app.get("/api/shorturl/:short_url", urlControler.getShortUrl);


app.listen(port, function () {
  console.log('Node.js listening ...');
});
