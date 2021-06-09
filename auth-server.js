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

const SERVER_PORT = process.env.SERVER_PORT || 3000
const MONGO_DB = process.env.MONGO_DB
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET

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

app.set('view engine', 'ejs')

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

app.post('/register', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = new User({
        username: req.body.username,
        password: hashedPassword,
        email: req.body.email,
    })
    try {
        await user.save()
        console.log(`MongoDB: User: '${user._id}' added to 'Users' database`)
        res.redirect('/login')
    } catch (err) {
        console.error(err)
        res.status(400).send(err)
    }
})

app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username })
    if (!user) return res.status(400).send('Wrong username/password')
    const validPass = await bcrypt.compare(req.body.password, user.password)
    if (!validPass) return res.status(400).send('Wrong username/password')

    const accessToken = generateAccessToken(user)
    const refreshToken = jwt.sign({ _id: user._id }, REFRESH_TOKEN_SECRET)
    req.session.accessToken = accessToken
    req.session.userId = user._id
    req.session.save()
    user.refreshToken = refreshToken
    await user.save()

    res.redirect('/private')
})

app.delete('/logout', async (req, res) => {
    const user = await User.findOne({ _id: req.session.userId })
    if (!user) return res.status(400).send('User not found')
    user.refreshToken = null
    req.session.accessToken = null
    req.session.save()
    await user.save()
    res.status(204).send('Logged out!')
})

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

const generateAccessToken = (user) => {
    return jwt.sign({ _id: user._id }, ACCESS_TOKEN_SECRET, {
        expiresIn: '15m',
    })
}
