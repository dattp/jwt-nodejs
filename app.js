const express = require('express');
const jwt = require('jsonwebtoken');

// defining the Express app
const app = express();

const PORT = 3000;

const accessKey = 'access_key'; // secret
const refreshKey = 'refresh_key'; // secret

const signJWT = (payload, expire, key) => {
  const option = {
    algorithm: "HS256",
    expiresIn: expire,
    issuer: 'backend-node'
  };

  return jwt.sign(payload, key, option);
}

const tokenUser = new Map(); // fake-database

const verifyJWT = (token, key) => {
  try {
    return jwt.verify(token, key);
  } catch (error) {
    console.log(error.message);
    return null
  }
}

// defining the Express app
app.disable('x-powered-by');

app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: '200kb' }));

app.get('/hz', (req, res) => {
  res.send('Ok');
});

// demo
app.get('/token', (req, res) => {
  const user = {
    user_id: 123,
    username: 'datpt'
  };
  const accessToken = signJWT(user, '10 m', accessKey);

  const refreshToken = signJWT(user, '30 day', refreshKey);
  const accessSignature = accessToken.split('.')[2];
  const refreshSignature = refreshToken.split('.')[2];
  tokenUser.set(user.user_id, {
    access_sign: accessSignature,
    refresh_sign: refreshSignature
  });
  return res.send({ token: accessToken, refresh: refreshToken });
})

app.get('/check-token', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(401).send('error 0');
  }
  try {
    const checkToken = verifyJWT(token, accessKey);
    if (verifyJWT(token, accessKey)) {
      // check thêm điều kiện ở token store
      const accessSignature = token.split('.')[2];
      const userId = checkToken.user_id;
      if (tokenUser.get(userId) && tokenUser.get(userId).access_sign === accessSignature) {
        return res.send('Ok');
      } else {
        return res.status(401).send('error 1');
      }
    }
    return res.status(401).send('error 2');

  } catch (error) {
    console.log(error);
    return res.status(401).send('error 3');
  }
})

app.get('/refresh-token', (req, res) => {
  const { access_token: accessToken, refresh_token: refreshToken } = req.query // refresh-token
  if (!refreshToken || !accessKey) {
    return res.status(401).send('error 0');
  }
  try {
    const checkToken = verifyJWT(refreshToken, refreshKey);
    if (verifyJWT(refreshToken, refreshKey)) {
      const refreshSignature = refreshToken.split('.')[2];
      const userId = checkToken.user_id;
      if (tokenUser.get(userId) && tokenUser.get(userId).refresh_sign === refreshSignature) {
        const checkAccessToken = verifyJWT(accessToken, accessKey)
        if (checkAccessToken) {
          // access token hiện tại vẫn đang sử dụng đc => sao lại cần cấp mới
          // có vấn đề => đẩy ra logout 
          return res.status(401).send('error 1');
        }
        const accessSignature = accessToken.split('.')[2];
        const infoAccessToken = jwt.decode(accessToken);
        const timeNow = new Date().getTime()
        // check theo signatrue gần nhất được cấp
        if (tokenUser.get(userId).access_sign === accessSignature && infoAccessToken.exp * 1000 < timeNow) {
          // tao token moi, cap nhat vao store
          const accessTokenNew = signJWT({
            user_id: 123,
            username: 'datpt'
          }, '10 m', accessKey);
          tokenUser.get(userId).access_sign = accessTokenNew.split('.')[2]
          return res.send({ token: accessTokenNew })
        } else {
          return res.status(401).send('error 2');
        }
      }
    }
    return res.status(401).send('error 3');
  } catch (error) {
    console.log(error);
    return res.status(401).send('error 4');
  }
})

// starting the server
app.listen(PORT, () => {
  console.log(`  Service user start on port: ${PORT}`);
});


process.on('exit', () => {
});

