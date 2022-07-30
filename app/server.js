// server.js
// where your node app starts

// init project
const express = require("express");
const app = express();
// const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;

// default array of leaderboard entries
const defaultEntries = [
  { username: "ManseMus1", score: 300 },
  { username: "Tapok", score: 200 },
  { username: "Diktaturet", score: 100 }
];

// setup database
const Datastore = require('nedb');
// const db = new Datastore({ filename: '.data/datafile', autoload: true });
const db = new Datastore({ filename: 'datafile.nedb', autoload: true });
db.count({}, function (err, count) {
  console.log("There are " + count + " entries in the database");
  if(err) console.log("There's a problem with the database: ", err);
  else if(count<=0){ // empty database so needs populating
    // default entries inserted in the database
    db.insert(defaultEntries, function (err, scoresAdded) {
      if(err) console.log("There's a problem with the database: ", err);
      else if(scoresAdded) console.log("Default entries inserted in the database");
    });
  }
});

// make all the files in 'public' available
app.use(express.static("public"));
// use json
app.use(express.json({ limit: "10kb" }));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/public/index.html");
});

app.get("/getIP", function (request, response) {
      const IP = { ip: "" + request.headers["x-forwarded-for"].split(",")[0] };
      response.send(IP);
});

// send entries to web page
app.get("/getEntries", function (request, response) {
  var dbEntries=[];
  db.find({}, function (err, entries) { // Find all entries in the collection
    entries.forEach(function(entry) {
      dbEntries.push({ username: entry.username, score: entry.score }); // adds the info to the dbEntries value
    });
    response.send(dbEntries); // sends dbEntries back to the page
  });
});

// enter a new entry to database
app.post("/postEntry", function (request, response) {
  db.insert(request.body, function (err, entryAdded) {
    if(err) console.log("There's a problem with the database: ", err);
    else if(entryAdded) console.log("New entry inserted in the database");
  });
  response.sendStatus(200);
});

app.post("/deleteEntry", function (request, response) {
  db.remove(response.body, {});
  response.sendStatus(200);
});

// removes all entries from the collection
app.get("/clear", function (request, response) {
  db.remove({}, { multi: true }, function (err) {
    if(err) console.log("There's a problem with the database: ", err);
    else console.log("Database cleared");
  });
  response.redirect("/");
});

// removes entries and populates database with defaults
app.get("/reset", function (request, response) {
  // removes all entries from the collection
  db.remove({}, { multi: true }, function (err) {
    if(err) console.log("There's a problem with the database: ", err);
    else console.log("Database cleared");
  });
  // defaults inserted in the database
  db.insert(defaultEntries, function (err, usersAdded) {
    if(err) console.log("There's a problem with the database: ", err);
    else if(usersAdded) console.log("Default users inserted in the database");
  });
  response.redirect("/");
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
// const listener = app.listen(443, () => {
//     console.log("Your app is listening on port " + listener.address().port);
// });

