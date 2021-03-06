const jwt = require('jsonwebtoken');
const redis = require('redis');

// setup redis:
const redisClient = redis.createClient(process.env.REDIS_URL);

const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return Promise.reject('incorrect form submission');
  }
  return db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => user[0])
          .catch(err => Promise.reject('unable to get user'))
      } else {
        Promise.reject('wrong credentials')
      }
    })
    .catch(err => Promise.reject(`wrong credentials. ${err}`))
}

const getAuthTokenId = (req, res) => {
  const { authorization } = req.headers;
  return redisClient.get(authorization, (err, reply) => {
    if (err || !reply) {
      return res.status(400).json('Unauthorised');
    }
    return res.json({id: reply});
  })
}

// TODO: process.env.JWTSECRET for secret
const signToken = (email) => {
  const jwtPayload = { email };
  return jwt.sign({ jwtPayload }, 'JWT_SECRET', { expiresIn: '2 days'});
}

// accepts token and ID as key/value pair
const setToken = (key, value) => {
  return Promise.resolve(redisClient.set(key, value))
}

const createSessions = (user) => {
  // Create JWT token and return user data
  const { email, id } = user;
  const token = signToken(email);
  return setToken(token, id)
  .then(() => {
    return { success: 'true', userId: id, token }
  })
  .catch(console.log)
}

const signinAuthentication = (db, bcrypt) => (req, res) => {
  const { authorization } = req.headers;
  return authorization ? getAuthTokenId(req, res) :
    handleSignin(db, bcrypt, req, res)
    .then(data => {
      return data.id && data.email ? createSessions(data) : Promise.reject(data)
    })
    .then(session => res.json(session))
    .catch(err => res.status(400).json(err))
}

module.exports = {
  signinAuthentication: signinAuthentication,
  redisClient: redisClient
}
