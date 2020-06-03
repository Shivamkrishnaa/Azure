import { JsonController, Post, BodyParam, NotAcceptableError, UnauthorizedError, Authorized, Get, Req, Res, CurrentUser } from 'routing-controllers';
import jwt = require('jsonwebtoken');
import bcrypt from 'bcrypt';
import { request, response} from 'express'
@JsonController()
export class LoginController {
  
  private user = { name: 'user', password: 'qwerty' };
  jwtKey = process.env.JWTKEY || 'JWTkey';
  private saltRound = 10;

  constructor() {
    bcrypt.genSalt(this.saltRound, (err: Error, salt: string) => {
      bcrypt.hash(this.user.password, salt, (hashErr: Error, hash: string) => {
        this.user.password = hash;
      });
    });
  }

  @Post('/login')
  login(@BodyParam('user') user: string, @BodyParam('pass') pass: string) {
    if (!user || !pass) {
      throw new NotAcceptableError(' No Email and password provided');
    } else if (user != this.user.name) {
      throw new NotAcceptableError(' UserName incorrect');
    } else {
      return new Promise<any>((resolve, reject) => {
        bcrypt.compare(pass, this.user.password, (err: Error, result: boolean) => {
          if (result) {
            const token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + 60 * 60, data: { username: this.user.name } }, this.jwtKey);
            resolve({ token: token })
          } else {
            reject(new UnauthorizedError('Passowrd do not match'));
          }
        });
      });
    }
  }

  @Authorized()
  @Get('/routeWauth')
  authrequired(@Req() request: any, @Res() response: any) {
    return response.send('<h1> Authorised world</h1>');
  }

  @Authorized()
  @Get('/routewacurrentuser')
  updatepass(@CurrentUser({ required: true }) currentUser: any, @Res() response: any) {
    return response.send(`<h1> ${currentUser.user}`);
  }
}
