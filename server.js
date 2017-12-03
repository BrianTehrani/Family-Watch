// Server

////////////////////////////////////////////////////////////////////////
// Modules
var express           =     require('express')
  , passport          =     require('passport')
  , util              =     require('util')
  , FacebookStrategy  =     require('passport-facebook').Strategy
  , session           =     require('express-session')
  , config            =     require('./config')
  , mysql             =     require('mysql');
const app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
const io = require('socket.io')(); // Socket
const fs = require('fs');
const https = require('https');
const path = require('path');

////////////////////////////////////////////////////////////////////////
// Configurations

// uncomment after placing favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Set view engine to HTML
app.engine('html', require('ejs').renderFile);
app.set('public', __dirname + '/public');
app.set('view engine', 'html');

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// Set port
var port = process.env.PORT || 3001;

// Set to HTTPS for GPS sharing
const httpsOptions = {
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'police.crt')),
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'police.key'))
}


////////////////////////////////////////////////////////////////////////
// MySQL Database

// Define MySQL parameter in Config.js file.
db = config.database;
var connection = mysql.createConnection({
  host     : db.host,
  user     : db.user,
  password : db.password,
  database : db.database
});

connection.connect(function(err) {
  if (err) throw err
  console.log('You are now connected to the MySQL Database.')
})

////////////////////////////////////////////////////////////////////////
// HTTP Methods

// Post request checking login credentials
app.post('/login', (req, res) => {

  console.log(req.body.username);
  console.log(req.body.password);

  console.log("Running query...");

  var userinfo = [];

  // yb todo:
  // Make a query using WHERE condition on req.body.username and
  // req.body.password
  connection.query('SELECT * FROM User WHERE Username="' + req.body.username + '" and Password="' + req.body.password + '";', (err, result, fields) => {
    if (err) throw err;
    else {
      // Check if one entry in SQL database shows up correctly
      console.log("Verifying login credentials.\n");
      if(Object.keys(result).length === 0) {
        console.log("Wrong username and password!");
        res.contentType('application/json');
        res.send(JSON.stringify(userinfo));
      }
      else {
        console.log(result);
        console.log(result[0].Username);
        console.log(result[0].Password);
        userinfo.push({
          username: result[0].Username,
          password: result[0].Password
        });
        console.log("Hey1");
        console.log(userinfo);
        res.contentType('application/json');
        res.send(JSON.stringify(userinfo));

      }
    }
  });

  // If login credentials are wrong, do something
  // If login credentials are correct, send the User ID and username
  // to front-end at Profile.jsx
});

app.get('/users', (req, res, next) => {

  console.log("Running query...");
  connection.query('SELECT * FROM User', (err, result, fields) => {
    if (err) throw err;
    else {
      console.log("Retrieving list of users.\n");

      res.json([
        {
  	      id: result[0].User_ID,
  	      name: result[0].Username
        },
        {
  	      id: result[1].User_ID,
  	      name: result[1].Username
        },
        {
          id: result[2].User_ID,
          name: result[2].Username
        },
        {
          id: result[3].User_ID,
          name: result[3].Username
        }
      ]);
    }
  });
});

app.post('/history', (req, res) => {

  // Retrieve GPS history from this user
  const user_id = req.body.user_id;

  connection.query('SELECT * from GPS where hid=' + user_id + ';', (err, result, fields) => {
    if (err) {
      console.log("GPS history retrieval failed.");
      throw err;
    }
    else {
      console.log("Running query...");
      // Replace user with actual person getting queried
      console.log("Retrieving GPS history\n");

      var history = [];
      for (var i = 0; i < result.length; i++) {
        history.push({
          id: user_id,
          time: result[i].Time_record,
          longitude: result[i].Longitude,
          latitude: result[i].Latitude
        })
      }

      res.contentType('application/json');
      res.send(JSON.stringify(history));
    }
  });
});


app.post('/coordinates', (req, res) => {

  console.log("Running query...");

  const param = req.body;
  const longitude = param.longitude;
  const latitude = param.latitude;

  // todo:
  // Need to replace query with '1' to respective user ID

  if (longitude === 0 && latitude === 0) {
    console.log("Setting up GPS...\n")
  }
  else {
    console.log("Inserting into database:")
    console.log("Longitude: " + longitude);
    console.log("Latitude: " + latitude + "\n");
    connection.query('INSERT INTO GPS (hid, Longitude, Latitude) VALUES ("'
                     + 1 + '", "' + longitude + '", "' + latitude + '");');
  }

  res.end("Success!");
});

////////////////////////////////////////////////////////////////////////
// Start Application

// Server at localhost:3001
// React client running at localhost:3000

// Switch to HTTPS
https.createServer(httpsOptions, app)
  .listen(port, function() {
    console.log('Server running on port ' + port + ' via HTTPS...');
  })

// Note: In order for HTTPS to run, you must disable security on google chrome:
// $ chromium-browser --disable-web-security --user-data-dir
// On https://localhost:3000, click on 'Advanced' to override the
// "Connection is not private"

//app.listen(port);

module.exports = app;
