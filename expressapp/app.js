const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const MongoClient = require('mongodb').MongoClient;
const EventDao = require('./dao/EventsDao');
const config = require('./config/conf');
const bodyParser = require('body-parser');
const eventsRouter = require('./routes/events');
const devicesRouter = require('./routes/devices');
const infoRouter = require('./routes/info');
const auth = require("./routes/auth");

const {getSHA1} = require("./utils");
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const users = [
  {
    login: "admin",
    password: getSHA1("12345")
  }
];

const checkUser = ({password, login})=> {
  return users.find(user => user.password === getSHA1(password) && user.login === login)
};

const checkAuthorized = (req,res,next)=> {
  if (req.session.authorized){
    next()
  }else{
    res.redirect("/login")
  }
};



module.exports = async function(){
  const db = await MongoClient.connect(config.db.url);
  const eventDao = new EventDao(db);

  const app = express();

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(session({
    secret: 'some secret',
    saveUninitialized: true,
    resave: true,
    store: new MongoStore({db})
  }));

  app.use("/", auth(checkUser));
  app.use("/events", eventsRouter(eventDao));
  app.use("/info", infoRouter());

  app.use("/devices",checkAuthorized, devicesRouter(eventDao));

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  return app
};

