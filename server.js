'use strict'

var sql = require('mssql')
var app = require('express')()
var cors = require('cors')

function getPass () {
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

function addComment (fName, lName, articleTitle, content) {
  return new sql.Request()
    .input('personFName', fName)
    .input('personLName', lName)
    .input('articleTitle', articleTitle)
    .input('content', content)
    .execute('uspAddComment')
}

function makeRouter () {
  app.use(cors())
  
  app.get('/articles', (req, res) => {
    getArticles().then((data) => {
      res.json(data)
    })
  })

  // Makes a test comment and writes it out to the database!
  app.get('/test', (req, res) => {
    addComment('Greg', 'Hay', 'Clinton: Stupid CNN article', 'This is another comment from the WEB')
      .then(() => { console.log('Hello')} )
  })
}

function startParty () {
  connectToDb().then(() => {
    makeRouter()
    app.listen(3000);
  })
}

startParty()