const express = require('express');
const router = express.Router();
const {createPost, getAllPost, getPost, deletePost} = require('../controllers/post-controller')
const {authenticateRequest} = require('../middleware/authMiddle')



//middleware -> this is thing can tell if the user is auth user or not




router.use(authenticateRequest)

router.post('/create-post', createPost);
router.get('/getall-post', getAllPost);
router.get('/get-post/:id', getPost);
router.delete('/delete-post/:id', deletePost);



module.exports = router;


