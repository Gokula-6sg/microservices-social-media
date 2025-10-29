const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const dotenv = require("dotenv")
const Refreshtoken = require('../models/refreshToken')
dotenv.config()

const generateToken = async(user)=>{



    //Acces the token
    const accesstoken = jwt.sign({
        userId: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, {expiresIn: "60m"});




    // refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7)  // refersh token expires in 7 days



    await Refreshtoken.create({
        token : refreshToken,
        user : user._id,
        expiresAt
    })


    return {accesstoken , refreshToken}
}

module.exports = generateToken


