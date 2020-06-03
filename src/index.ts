import 'reflect-metadata';
import { useExpressServer, Action } from 'routing-controllers';
import express from 'express';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import jwt = require('jsonwebtoken');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, prettyPrint, simple } = format;

// todo controller
import { IndexController , LoginController } from './controller'
//ecpress server

const loglevel = process.env.LOGLEVEL || 'info';
const logDir = process.env.LOGDIR || './log';
const port = process.env.PORT || 3371;
const jwtKey = process.env.JWTKEY || 'complexKey';
const app = express();

if (process.env.ENV !== 'development') {
  app.set('trust proxy', true);
  app.use(helmet());
  app.disabled('x-powered-by');
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Logging
const logger = createLogger({
  level: process.env.LOGLEVEL,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.simple()
  ),
  transports: [
    new transports.Console({
      level: loglevel,
      handleExceptions: true,
      json: false,
      colorize: true
    }),
    new transports.File({
      level: loglevel,
      filename: `${logDir}/server.log`,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false
    }),
    new transports.File({
      level: 'error',
      filename: `${logDir}/error.log`,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false
    })
  ]
});
logger.stream = {
  write: (message: any, encoding: any) => {
    logger.log({
      level: 'info',
      message: message
    });
  }
};

useExpressServer(app, {
  errorOverridingMap: {
    ForbiddenError: {
      message: 'Access is denied'
    }
  },
  authorizationChecker: async (action: Action) => {
    const token = action.request.headers['authorization'];
    let check: boolean;
    jwt.verify(token, jwtKey, (error: any, sucess: any) =>  {
      if (error) { check = false; } else {  check = true;  }
    });
    return check;
  },
  currentUserChecker: async (action: Action) => {
    const token = action.request.headers['authorization'];
    const check = confirmUser(token);
    return check;
  },
  controllers: [ IndexController, LoginController ]
});

app.listen(port, () => {
  logger.log({ //logger
    level: 'info',
    message: `Sever: server running on: ${port} `
  })
})
async function confirmUser(token: any) {
  return await new Promise((ok, fail) => {
   jwt.verify(token, jwtKey, (error: any, success: any) => {
     if (error) {
       fail({ user: null, currentuser: false });
     } else {
       ok({ user: success.data.username, currentuser: true });
     }
    });
  });
}