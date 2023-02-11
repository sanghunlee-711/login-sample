// 사용자가 보낸 값을 보안을 위해 escape하기 위한 모듈입니다. //예를 들어foo&bar>>foo&amp;bar로 바꿉니다.
const escapeHtml = require('escape-html');
const express = require('express');
const session = require('express-session');
const app = express();

app.use(
  session({
    name: 'session-id',
    secret: 'thisisscret!!!',
    resave: false,
    saveUninitialized: false,
  })
);

const isAuthenticated = (req, res, next) => {
  if (req.session.user) next();
  //세션이 없는 경우 다음 route로 제어권 변경
  else next('route');
};

app.get('/', isAuthenticated, (req, res) => {
  res.send(escapeHtml(req.session.user) + '환영합니다!');
});

app.get('/', (req, res) => {
  const template = /* html */ `
    <h1>로그인</h1>
    <form action="/login" method="post">
      Username: <input name="user"><br>
      Password: <input name="pass" type="password"><br>
      <input type="submit" text="Login">
    </form>
  `;

  res.send(template);
});

app.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  //원래면 DB에 찾아봐야겠지만 여기서는 간단히
  if (req.body.user === 'cloud' && req.body.pass === 'test') {
    req.session.regenerate((err) => {
      if (err) next(err);

      req.session.user = req.body.user;

      //세션 생성>>쿠키값 설정>>이후 다시 리다이렉팅
      req.session.save((err) => {
        if (err) return next(err);
        res.redirect('/');
      });
    });
  } else res.redirect('/');
});

app.listen(3000, () =>
  console.log('server is started : http://localhost:3000')
);
