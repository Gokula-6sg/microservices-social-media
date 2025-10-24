const generateToken = require('../utils/GenerateToken')
const {validateReg} = require('../utils/validation')
const logger = require('../utils/logger');
const User = require("../models/User");


// user registration
const registerUser = async(req, res) => {
    logger.info('Registration endpoint hitted....');

    try{
        //validate the schema
        const {error} = validateReg(req.body);
        if(error){
            logger.warn('validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            })
        }

        const {email, password, username} = req.body;
        let user = await User.findOne({$or: [{ email }, {username}]});
        if(user){
            logger.warn('User already is exist');
            return res.status(400).json({
                success: false,
                message: 'User already exist',
            })
        }
        user = new User({username, email, password});
        await user.save();
        logger.warn("user saved sucessfully", user._id)

        const {accesstoken,refreshToken} = await generateToken(user);
        res.status(200).json({
            success: true,
            message: 'User registered successfully',
            accesstoken,
            refreshToken
        })

    }catch(error){
        logger.error('registration error occured')
        res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
}


//user login




//refresh token




//logout


module.exports = {registerUser}


