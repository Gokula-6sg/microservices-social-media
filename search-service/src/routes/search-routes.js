const express = require('express')
const router = express.Router()
const searchPostcontrol = require('../controllers/search-controller')
const {authenticateRequest} = require('../middleware/authMiddle')



router.use(authenticateRequest);

router.get('/post', searchPostcontrol)

module.exports = router