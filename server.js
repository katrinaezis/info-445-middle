'use strict'

var sql = require('mssql')
var app = require('express')()

function getPass() {
  var pass = process.env.PASSWORD
  if (!pass) {
    throw new Error('Missing PASSWORD environment variable')
  }
  return pass
}

function connectToDb () {
  var config = {
    user: 'INFO445',
    password: getPass(),
    server: 'is-hay04.ischool.uw.edu',
    database: 'JOURNEY_JOURNAL'
  }
  return sql.connect(config)
}

// Returns a promise with the articles from the DB
function getArticles () {
  return new sql.Request().query('SELECT TOP 20 * FROM ARTICLE')
}

function makeRouter () {
  app.get('/', function(req, res) {
    getArticles().then((data) => {
      res.json(data)
    })
  })
}

function startParty () {
  connectToDb().then(() => {
    makeRouter()
    app.listen(3000);
  })
}

startParty()