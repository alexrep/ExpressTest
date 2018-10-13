const express = require('express');
const router = express.Router();

/* GET users listing. */

module.exports = (eventDao)=>{
  router.post('/', function(req, res) {
    eventDao.saveEvents(req.body).then(()=> res.end())
  });
  return router
};
