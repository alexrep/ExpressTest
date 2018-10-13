const express = require('express');
const router = express.Router();

module.exports = (checkUser)=>{
  router.get('/', function(req, res) {
    res.render("info")
  });

  return router
};
