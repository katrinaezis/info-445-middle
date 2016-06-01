'use strict'

var sql = require('mssql')
var app = require('express')()
var cors = require('cors')
var bodyParser = require('body-parser')

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

// Returns the comments for a given article ID
function getComments (id) {
  const q = `SELECT * FROM COMMENT WHERE ArticleID = ${id}`
  return new sql.Request().query(q)
}

function addComment (fName, lName, articleTitle, content) {
  return new sql.Request()
    .input('personFName', fName)
    .input('personLName', lName)
    .input('articleTitle', articleTitle)
    .input('content', content)
    .execute('uspAddComment')
}

// Deletes the comment with a given ID
function deleteComment (id) {
  const delComment = () => {
    const commentDeleteQ = `DELETE FROM COMMENT WHERE CommentID = ${id}`
    return new sql.Request().query(commentDeleteQ)
  }

  const delCommentReview = () => {
    const commentReviewDeleteQ = `DELETE FROM REVIEW_COMMENT WHERE CommentID = ${id}` 
    return new sql.Request().query(commentReviewDeleteQ)
  }

  var tran = new sql.Transaction()
  return tran.begin()
    .then(delComment())
    .then(delCommentReview())
    .then(() => {
      // We only get here if the above deletions succeed
      return tran.commit()
    })
}

function loadMiddleWare () {
  app.use(cors()) // So we can use different hosts
  app.use(bodyParser.json()) // For handling post requests
}

function makeRouter () {
  app.get('/articles', (req, res) => {
    getArticles().then((data) => {
      res.json(data)
    })
  })

  // Makes a test comment and writes it out to the database!
  app.post('/comments', (req, res) => {
    addComment(req.body.fname, req.body.lname, req.body.title, req.body.content)
      .then(() => { 
        console.log('Added new comment')
        res.sendStatus(200)
      })
      .catch((e) => {
        console.log(e)
        res.sendStatus(404)
      })
  })

  // Get's all the comments associated with a given articleID
  app.get('/comments/:id', (req, res) => {
    getComments(req.params.id)
      .then(() => { res.sendStatus(200) })
      .catch((e) => { res.status(400).json({ error: e.message }) })
  })

  // Deletes the comment from the database
  app.get('/comments/delete/:id', (req, res) => {
    deleteComment(req.params.id)
      .then(() =>{ res.sendStatus(200) })
      .catch((e) => { res.status(400).json({ error: e.message }) })
  })

}

function startParty () {
  connectToDb().then(() => {
    loadMiddleWare()
    makeRouter()
    app.listen(3000)
    console.log('Listening...')
  }).catch((e) => {
    console.log('Error')
    console.log(e)
  })
}

startParty()
