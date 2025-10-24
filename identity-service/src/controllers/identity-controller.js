const generateToken = require('../utils/GenerateToken')
const {validateReg,validateLogin} = require('../utils/validation')
const logger = require('../utils/logger');
const User = require("../models/User");
const argon2 = require('argon2');
const refreshToken = require("../models/refreshToken");


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

        const hashedPassword = await argon2.hash(password);
        user = new User(
            {username, email, password : hashedPassword},);
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

const loginUser = async(req, res)=>{
    logger.info('Login endpoint hitted....');
    try{
        const {error} = validateLogin(req.body);
        if(error){
            logger.warn('validation error', error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            })
        }

        const {email, password} = req.body;
        const user = await User.findOne({email})
        if(!user){
            logger.warn('Invalid User')
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials',
            })
        }

        // check the password is correct or not


        const inValidpass = await user.comparePassword(password);
        if(!inValidpass){
            logger.warn('Invalid password')
            return res.status(400).json({
                success: false,
                message: 'Invalid Password',
            })
        }


        const {accesstoken,refreshToken} = await generateToken(user);
        res.json({
            accesstoken,
            refreshToken,
            userId : user._id,
        })


    }
    catch(error){
        logger.error('login error occured')
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'internal server error'

    })
    }
}




//refresh token
const refreshTokenController = async(req, res)=>{
    logger.info('Refresh token....hitted')
    try{
        const {RefreshToken} = req.body;

        //check the refresh token is provided or not
        if(!RefreshToken){
        logger.warn('Refresh token missing')
            res.status(400).json({
                success: false,
                message: 'Refresh token missing',
            })
        }

        //chech the tokken is available or expired
        const storedToken =  await refreshToken.findOne({token : RefreshToken})
        if(!storedToken || storedToken < new Date()){
            logger.warn('Invalid or expired token')
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token',
            })

        }

        //find the user for generatong the new token
        const user = await User.findById(storedToken.user)
        if(!user){
            logger.warn('user not found')
            return res.status(400).json({
                success: false,
                message: 'User not found',
            })

        }

        //generate the new token

        const {accesstoken: newAccesstoken, refreshToken : newRefreshtoken} = await generateToken(user);



        //Delete the old refresh token

        await refreshToken.deleteOne({_id : storedToken._id})

        res.json({
            accesstoken: newAccesstoken,
            refreshToken : newRefreshtoken,
        })

    }catch(error){
        logger.error('Refresh token error occured')
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'internal server error'

        })
    }
}




//logout
const logoutUser = async(req, res)=>{
    logger.info('Logout endpoint hitted....');
    try{
        const {RefreshToken} = req.body;
        if(!RefreshToken){
            logger.warn('Refresh token missing')
            res.status(400).json({
                success: false,
                message: 'Refresh token missing',
            })
        }

        await refreshToken.deleteOne({token : RefreshToken})
        logger.info('Refresh token successfully deleted for logout')

        res.json({
            success: true,
            message: 'Successfully logged out',
        })


    }catch(error){
        logger.error('Error occured while logging out')
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'internal server error'

        })
    }
}







module.exports = {registerUser, loginUser, refreshTokenController, logoutUser}


