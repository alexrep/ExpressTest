const express = require('express');
const router = express.Router();

module.exports = (eventDao)=>{
  router.get('/overall', function(req, res) {
    eventDao.devicesByDate(req.query).then((result)=> res.send(result))
  });

  router.get('/export', function(req, res) {
    eventDao.export(req.query).then((result)=>{
      res.header("Content-Type",'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${req.query.deviceId}export.json`);

      res.send(result);
    } )
  });

  router.get('/byLevel', function(req, res) {
    eventDao.byLevel(req.query).then((result)=> res.send(result))
  });

  return router
};
