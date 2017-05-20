var express = require('express');
var router = express.Router();
var pg = require('../../psql-database');
var bodyParser = require('body-parser');
var services = require('../../services');
var Promise = require('bluebird');

var ensureAuthorized = services.ensureAuth;

router.use(express.static(__dirname + '/../../react-client/dist'));
router.use(bodyParser.json());

var insertQuestionAsync = Promise.promisify(pg.insertQuestion);

router.post('/save', ensureAuthorized, (req, res) => {
  let user_id = req.decoded.id
  let questions = req.body.questions;
  let homework_name = req.body.name;
  Promise.map( questions, (question) => {
    let questionObj = {
      type: question.type,
      content: JSON.stringify(questions),
      created_by: user_id
    }
    return questionObj;
  })
  .then((questionObjs) => {
    Promise.map(questionObjs, (questionObj) => {
      return insertQuestionAsync(questionObj)
      .then((questionRow) => {
        return questionRow.attributes.id;
      })
    })
    .then((questionIds) => {
      let options = {
        title: homework_name,
        teacher_id: user_id,
        questions: JSON.stringify(questionIds)
      }
      pg.insertHomework(options, (err, homework) => {
        if (homework) {
          res.send(homework);
        }
      })
    })
  })
})

module.exports = router;