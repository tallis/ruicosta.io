// ruicosta.io API 1.0
// dec 2016
var express = require('express');
var strava = require('strava-v3');
var curl = require('curlrequest');
var parser = require('parse-rss');
var config = require('./../config.json');

var router = express.Router();

/* GET RUNS */
router.get('/runs', function (req, res, next) {
  var stats = {
      runs: {
        ytd_runs: 0,
        ytd_distance: 0,
        ytd_time: 0
      }
    }
    // STRAVA API
  strava.athletes.stats(config.strava, function (err, payload) {
    if (!err) {
      stats.runs.ytd_runs = payload.ytd_run_totals.count;
      stats.runs.ytd_distance = parseFloat(payload.ytd_run_totals.distance) / 1000
      stats.runs.ytd_time = payload.ytd_run_totals.elapsed_time
      console.log("RUNS REQUEST: " + stats.runs.ytd_runs + " runs in 2016. with a total of " + stats.runs.ytd_distance + " kms.");
      res.send(stats);
    } else {
      console.log(err);
    }
  });
});

/* GET FLIGHTS */
router.get('/flights', function (req, res, next) {
  var stats = {
    flights_info: {
      flights: {
        total: 0,
        domestic: 0,
        international: 0
      },
      distance: {
        total_km: 0,
        total_miles: 0,
        earth_laps: 0
      },
      flight_time: {
        total_hours: {
          hours: 0,
          minutes: 0
        },
        total_days: 0,
        total_weeks: 0
      }
    }
  }
  curl.request(config.flights, function (err, parts) {
    parts = parts.split('\n');
    var counter = 0
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].indexOf("profile-main-data") > 0) {

        stats.flights_info.flights.total = parseInt(parts[i + 2].split("<h2>")[1].split("<span")[0]);
        stats.flights_info.flights.domestic = parseInt(parts[i + 3].split("<p>")[1].split("domestic")[0]);
        stats.flights_info.flights.international = parseInt(parts[i + 4].split("\t")[3].split("international")[0]);
        stats.flights_info.distance.total_km = parseInt(parts[i + 7].split("<h2>")[1].split("<span")[0].replace(" ", ""));
        stats.flights_info.distance.total_miles = parseInt(parts[i + 8].split("<p>")[1].split("miles")[0].replace(" ", ""));
        stats.flights_info.distance.earth_laps = parseFloat(parts[i + 9].split("\t")[3].split("x")[0]);
        stats.flights_info.flight_time.total_hours.hours = parseInt(parts[i + 12].split("<h2>")[1].split("min")[0].split('<span class="unit">h</span>')[0]);
        stats.flights_info.flight_time.total_hours.minutes = parseInt(parts[i + 12].split("<h2>")[1].split("min")[0].split('<span class="unit">h</span>')[1].split("<span")[0]);
        stats.flights_info.flight_time.total_days = parseFloat(parts[i + 13].split("<p>")[1].split("days")[0]);;
        stats.flights_info.flight_time.total_weeks = parseInt(parts[i + 14].split("\t")[3].split("weeks")[0]);;
        break;
      }
    }
    res.send(stats);
  });
});

/* GET POSTS */
router.get('/posts', function (req, res, next) {
  var posts = {}
  parser('https://medium.com/feed/@vanschneider', function (err, rss) {
    if (err) {
      console.log(err);
    } else {
      var stories = [];
      for (var i = 0; i < rss.length; i++) {

        var new_story = {};

        new_story.title = rss[i].title;
        new_story.description = rss[i].description;
        new_story.date = rss[i].date;
        new_story.link = rss[i].link;
        new_story.author = rss[i].author;
        new_story.comments = rss[i].comments;

        stories.push(new_story);
      }
      console.log('stories:');
      console.dir(stories);
      res.send(stories)
    }

  });
})


module.exports = router;