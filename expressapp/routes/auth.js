const express = require('express');
const router = express.Router();

module.exports = (checkUser)=>{
  router.get('/login', function(req, res) {
    res.render("login")
  });

  router.post('/auth', function(req, res) {
    if (checkUser(req.body)){
      console.log("authorized")
      req.session.authorized = true;
      req.session.login = req.body.login;
      res.redirect("/info")
    } else {
      console.log("failed");
      res.redirect("/login")
    }
  });

  return router
};
