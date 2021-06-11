const jwt = require('jsonwebtoken')

// Check if a user is authorized
module.exports = function (req, res, next) {
  // Get the access token from the request header
  const token = req.session.accessToken
  // If there is no access token return status 400 and access denied
  if (!token) return res.status(401).send('Access Denied')

  // Try to verify the access token and set the user to verified
  try {
    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    req.user = verified
    next()
  } catch (err) {
    res.status(400).send('Invalid Token')
  }
}
