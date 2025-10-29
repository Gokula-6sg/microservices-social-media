const express = require('express')
const router = express.Router()
const { registerUser, loginUser, refreshTokenController, logoutUser} = require('../controllers/identity-controller')





router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", logoutUser)
router.post("/refreshToken", refreshTokenController)







module.exports = router;