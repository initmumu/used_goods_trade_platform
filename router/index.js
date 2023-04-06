const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../controller/user');

// require maria.js
const maria = require('../database/connect/maria');


router.get('/kakao', passport.authenticate('kakao-login', {
    successRedirect: '/', failureRedirect: '/'
}, (req, res) => {
    res.send('hi');
}));




module.exports = router;