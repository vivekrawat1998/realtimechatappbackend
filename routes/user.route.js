const express = require('express');
const router = express.Router();
const { body } = require("express-validator")
const userController = require("../controllers/Usercontroller")


router.post('/register', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('fullname').isLength({ min: 3 }).withMessage('fullname name must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
],
    userController.registerUser
)

router.post('/login', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
],
    userController.LoginUser
)

module.exports = router;