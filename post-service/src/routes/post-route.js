const express = require('express');
const router = express.Router();
const {createPost} = require('../controllers/post-controller')
const {authenticateRequest} = require('../middleware/authMiddle')



//middleware -> this is thing can tell if the user is auth user or not




router.use(authenticateRequest)

router.post('/create-post', createPost);



module.exports = router;


