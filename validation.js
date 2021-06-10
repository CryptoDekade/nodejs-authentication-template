const Joi = require('joi')

const registerValidation = Joi.object({
    username: Joi.string().min(6).max(30).required(),

    password: Joi.string().min(6).max(1024).required(),

    email: Joi.string().lowercase().email().required(),
})

const loginValidation = Joi.object({
    username: Joi.string().min(6).max(30).required(),

    password: Joi.string().min(6).max(1024).required(),
})

module.exports = {
    registerValidation,
    loginValidation,
}
