// ruicosta.io API 1.0
// dec 2016
var express = require('express');
var strava = require('strava-v3');
var curl = require('curlrequest');
var parser = require('parse-rss');
var moment = require('moment');
var config = require('./../config.json');

var router = express.Router();

/* GET RUNS */
router.get('/runs', function (req, res, next) {
  var stats = {
      runs: {
        ytd_runs: 0,
        ytd_distance: 0,
        ytd_time: 0,
        total_runs: 0,
        total_distance: 0,
        total_time: 0
      }
    }
    // STRAVA API
  strava.athletes.stats(config.strava, function (err, payload) {
    if (!err) {
      console.log(payload)
      stats.runs.ytd_runs = payload.ytd_run_totals.count;
      stats.runs.ytd_distance = parseFloat(payload.ytd_run_totals.distance) / 1000
      stats.runs.ytd_time = payload.ytd_run_totals.elapsed_time
      stats.runs.total_runs = payload.all_run_totals.count;
      stats.runs.total_distance = parseFloat(payload.all_run_totals.distance) / 1000
      stats.runs.total_time = payload.all_run_totals.elapsed_time
      res.send(stats);
    } else {
      console.log(err);
    }
  });
});

/* GET FLIGHTS */
router.get('/flights', function (req, res, next) {
  var stats = {
    ytd: {
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
    },
    total: {
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
    },
  }
  curl.request(config.flights.url, function (err, parts) {
    parts = parts.split('\n');
    var counter = 0
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].indexOf("profile-main-data") > 0) {

        stats.ytd.flights_info.flights.total = parseInt(parts[i + 2].split("<h2>")[1].split("<span")[0]);
        stats.ytd.flights_info.flights.domestic = parseInt(parts[i + 3].split("<p>")[1].split("domestic")[0]);
        stats.ytd.flights_info.flights.international = parseInt(parts[i + 4].split("\t")[3].split("international")[0]);
        stats.ytd.flights_info.distance.total_km = parseInt(parts[i + 7].split("<h2>")[1].split("<span")[0].replace(" ", ""));
        stats.ytd.flights_info.distance.total_miles = parseInt(parts[i + 8].split("<p>")[1].split("miles")[0].replace(" ", ""));
        stats.ytd.flights_info.distance.earth_laps = parseFloat(parts[i + 9].split("\t")[3].split("x")[0]);
        stats.ytd.flights_info.flight_time.total_hours.hours = parseInt(parts[i + 12].split("<h2>")[1].split("min")[0].split('<span class="unit">h</span>')[0]);
        stats.ytd.flights_info.flight_time.total_hours.minutes = parseInt(parts[i + 12].split("<h2>")[1].split("min")[0].split('<span class="unit">h</span>')[1].split("<span")[0]);
        stats.ytd.flights_info.flight_time.total_days = parseFloat(parts[i + 13].split("<p>")[1].split("days")[0]);;
        stats.ytd.flights_info.flight_time.total_weeks = parseInt(parts[i + 14].split("\t")[3].split("weeks")[0]);;
        break;
      }
    }

    // Crappy code needs to move this to use promises - rui
    curl.request(config.flights.url_all, function (err, parts) {
      parts = parts.split('\n');
      var counter = 0
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].indexOf("profile-main-data") > 0) {
          stats.total.flights_info.flights.total = parseInt(parts[i + 2].split("<h2>")[1].split("<span")[0]);
          stats.total.flights_info.flights.domestic = parseInt(parts[i + 3].split("<p>")[1].split("domestic")[0]);
          stats.total.flights_info.flights.international = parseInt(parts[i + 4].split("\t")[3].split("international")[0]);
          stats.total.flights_info.distance.total_km = parseInt(parts[i + 7].split("<h2>")[1].split("<span")[0].replace(" ", ""));
          stats.total.flights_info.distance.total_miles = parseInt(parts[i + 8].split("<p>")[1].split("miles")[0].replace(" ", ""));
          stats.total.flights_info.distance.earth_laps = parseFloat(parts[i + 9].split("\t")[3].split("x")[0]);
          stats.total.flights_info.flight_time.total_hours.hours = parseInt(parts[i + 12].split("<h2>")[1].split("min")[0].split('<span class="unit">h</span>')[0]);
          stats.total.flights_info.flight_time.total_hours.minutes = parseInt(parts[i + 12].split("<h2>")[1].split("min")[0].split('<span class="unit">h</span>')[1].split("<span")[0]);
          stats.total.flights_info.flight_time.total_days = parseFloat(parts[i + 13].split("<p>")[1].split("days")[0]);;
          stats.total.flights_info.flight_time.total_weeks = parseInt(parts[i + 14].split("\t")[3].split("weeks")[0]);;
          break;
        }
      }
      console.log(JSON.stringify(stats))
      res.send(stats);
    });
  });
});

/* GET POSTS */
router.get('/posts', function (req, res, next) {
  console.log("posts")
  var posts = {
    stories: [],
    total_count: 0,
    ytd_count: 0
  }
  var current_year = new Date().getFullYear();
  parser('https://medium.com/feed/@vanschneider', function (err, rss) {
    if (err) {
      console.log(err);
    } else {
      posts.stories = [];
      for (var i = 0; i < rss.length; i++) {
      
        if (moment(rss[i].date).diff(current_year, "year") == 0) {
          // Counting how many posts were posted in the current year - rui
          posts.ytd_count += 1;
        }
        posts.total_count += 1
        var new_story = {};
        new_story.title = rss[i].title;
        new_story.description = rss[i].description;
        new_story.date = rss[i].date;
        new_story.link = rss[i].link;
        new_story.author = rss[i].author;
        new_story.comments = rss[i].comments;
        posts.stories.push(new_story);
      }
      res.send(posts)
    }

  });
})


module.exports = router;