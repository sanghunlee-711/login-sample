//*Ref: .env
// 다른방법도 많이 고안된 것이 있으니 쿠키에 담는것이 꼭 정답은 아니다
//https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation
const ACCESS_TOKEN_SECRET = 'ACCESS_TOKEN_SECRET';
const REFRESH_TOKEN_SECRET = 'REFRESH_TOKEN_SECRET';

const PORT = 3000;
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jwt');
const cors = require('cors');

const app = express();
//middleware setting
const MIDDLE_WARE_LIST = [
  () => cors(),
  () => express.json(),
  () => express.urlencoded({ extended: false }),
  () => cookieParser(),
];

const OPTIONS = {
  //토큰을 만들 때 쓰는 유저 객체
  USER: {
    username: userInfo.username,
    email: userInfo.email,
  },
  // 두개의 토큰에 대한 만료기한 옵션 : access토큰은 짧게. refresh토큰은 길게
  ACCESS: {
    expiresIn: '10m',
  },
  REFRESH: {
    expiresIn: '1d',
  },
  COOKIE: {
    httpOnly: true,
    sameSite: 'Strict',
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
};

MIDDLE_WARE_LIST.forEach((middleware) => app.use(middleware()));

const isAuthenticated = (req, res, next) => {
  if (!req.headers.authorization) {
    return next('route');
  }

  let auth = req.headers.authorization;

  if (auth.startsWith('Bearer ')) {
    auth = auth.substring(7, auth.length);
  }

  const user = jwt.verify(auth, ACCESS_TOKEN_SECRET);
  //인증된 유저가 있다면 다음 미들웨어로. 그게 아니라면 다음 라우팅으로. 제어권을 넘긴다.
  if (user) return next();
  else return next('route');
};

app.get('/', isAuthenticated, function (req, res) {
  return res.status(200).send('허용된 요청입니다.');
});
app.get('/', (req, res) => {
  return res.status(401).send('허용되지 않은 요청입니다.');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  console.log(username, password);
  if (
    username === OPTIONS.USER.username &&
    password === OPTIONS.USER.password
  ) {
    const accessToken = jwt.sign(
      OPTIONS.USER,
      ACCESS_TOKEN_SECRET,
      OPTIONS.ACCESS
    );
    const refreshToken = jwt.sign(
      OPTIONS.USER,
      REFRESH_TOKEN_SECRET,
      OPTIONS.REFRESH
    ); // cookie에는 refresh토큰을 담습니다.

    console.log('jwt토큰이 생성되었습니다.');
    /*
      초기 로그인 시 쿠키에 리프레시 토큰을 넣어서 보냄 ( 그 다음 응답부터는 자동으로 헤더에 쿠키가 있음)
    */
    res.cookie('refresh-jwt', refreshToken, OPTIONS.COOKIE);
    return res.json({ accessToken, refreshToken });
  } else {
    //만약 인증을 하지 않은 경우
    return res.status(401).json({ message: '인증되지 않은 요청입니다.' });
  }
});

app.post('/refresh', (req, res) => {
  console.log('REFRESH 요청 시작');
  const refreshToken = req.cookies['refresh-jwt'];
  if (!refreshToken)
    return res.status(401).json({ message: 'unauthorization request' });

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Authorization request' });
    }

    const accessToken = jwt.sign(
      OPTIONS.USER,
      ACCESS_TOKEN_SECRET,
      OPTIONS.ACCESS
    );

    const refreshToken = jwt.sign(
      OPTIONS.USER,
      REFRESH_TOKEN_SECRET,
      OPTIONS.REFRESH
    ); // cookie에는 refresh토큰을 담습니다.
    res.cookie('refresh-jwt', refreshToken, OPTIONS.COOKIE);

    return res.json({ accessToken });
  });
});

app.listen(PORT, () => {
  console.log(`서버시작 : http://localhost:${PORT}`);
  console.log(`로그인요청 : http://localhost:${PORT}/login`);
  console.log(`refresh요청 : http://localhost:${PORT}/refresh`);
});
