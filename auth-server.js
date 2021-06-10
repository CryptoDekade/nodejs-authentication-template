require('dotenv').config()

const express = require('express')
const app = express()

const mongoose = require('mongoose')
const User = require('./models/user')
const Session = require('./models/session')

const session = require('express-session')
const MongoStore = require('connect-mongo')
const verify = require('./verifyToken')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const { registerValidation, loginValidation } = require('./validation')

const SERVER_PORT = process.env.SERVER_PORT || 3000
const MONGO_DB = process.env.MONGO_DB
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET

// Setup a connection to the MongoDB database
mongoose
    .connect(MONGO_DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    })
    .then(
        () => {
            console.log('Connected to MongoDB database!')
        },
        (err) => {
            console.log(err)
        }
    )

mongoose.connection.on('err', (err) => {
    console.error(err)
})

// Setup the view engine
app.set('view engine', 'ejs')

// Middleware
app.use('/static', express.static('./public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
    session({
        secret: 'this is a secret',
        saveUninitialized: true,
        resave: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_DB,
            autoRemove: 'native',
        }),
        cookie: { maxAge: 1000 * 60 * 60 },
    })
)

// Routes
app.get('/', (req, res) => {
    res.render('index')
})

app.get('/private', verify, (req, res) => {
    res.send('This route is private!')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/login', (req, res) => {
    res.render('login')
})

// First try to validate the input from the register form.
// If that passes, check to see if the given username/password is already in the database.
// If there is no record in the database, hash the password, create a new user and push it to the database.
app.post('/register', async (req, res, next) => {
    try {
        const validationResult = await registerValidation.validateAsync(
            req.body
        )

        const usernameExists = await User.findOne({
            username: validationResult.username,
        })
        if (usernameExists)
            return res.status(400).send('Username already exists')

        const emailExists = await User.findOne({
            email: validationResult.email,
        })
        if (emailExists) return res.status(400).send('Email already exists')

        const hashedPassword = await bcrypt.hash(validationResult.password, 10)
        const user = new User({
            username: validationResult.username,
            password: hashedPassword,
            email: validationResult.email,
        })

        await user.save()
        console.log(`MongoDB: User: '${user._id}' added to 'Users' database`)
        res.redirect('/login')
    } catch (err) {
        if (err.isJoi) return res.status(422).send(err)
        next(err)
        if (err) return res.send(err)
    }
})

// First try to validate the input from the login form.
// If that passes, check to see if the username/password combination is correct.
// If correct, generate access and refresh token.
// Store the access token in the session cookie and push the refresh token to the database.
app.post('/login', async (req, res, next) => {
    try {
        const validationResult = await loginValidation.validateAsync(req.body)

        const validUser = await User.findOne({
            username: validationResult.username,
        })
        if (!validUser) return res.status(400).send('Wrong username/password')
        const validPass = await bcrypt.compare(
            validationResult.password,
            validUser.password
        )
        if (!validPass) return res.status(400).send('Wrong username/password')

        const accessToken = generateAccessToken(validUser)
        const refreshToken = jwt.sign(
            { _id: validUser._id },
            REFRESH_TOKEN_SECRET
        )
        req.session.accessToken = accessToken
        req.session.userId = validUser._id
        req.session.save()
        validUser.refreshToken = refreshToken
        await validUser.save()

        res.redirect('/private')
    } catch (err) {
        if (err.isJoi) return res.status(422).send(err)
        next(err)
        if (err) res.send(err)
    }
})

// Logout a user from his account
app.delete('/logout', async (req, res) => {
    const user = await User.findOne({ _id: req.session.userId })
    if (!user) return res.status(400).send('User not found')
    user.refreshToken = null
    req.session.accessToken = null
    req.session.save()
    await user.save()
    res.status(204).send('Logged out!')
})

// Generate a new access token from a refresh token stored in the user database
app.post('/token', async (req, res) => {
    const user = await User.findOne({ _id: req.session.userId })
    if (!user) return res.status(400).send('User not found')
    const refreshToken = user.refreshToken

    if (refreshToken === null)
        return res.status(400).send('refreshToken is null')
    if (refreshToken !== user.refreshToken) return res.status(403)

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403)
        const accessToken = generateAccessToken({ username: user.username })
        req.session.accessToken = accessToken
        req.session.save()
        res.status(201).send('New Access Token Generated')
    })
})

app.listen(SERVER_PORT, () => {
    console.log(`Server listening on port ${SERVER_PORT}`)
})

// Generate a JWT access token
const generateAccessToken = (user) => {
    return jwt.sign({ _id: user._id }, ACCESS_TOKEN_SECRET, {
        expiresIn: '15s',
    })
}
