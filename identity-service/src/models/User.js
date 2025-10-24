const mongoose = require('mongoose');
const argon2 = require('argon2');



const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true,
        unique: true,
        trim: true,

    },
    email : {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,

    },
    password : {
        type: String,
        required: true,
    },
    createdAt : {
        type: Date,
        default: Date.now,
    },
},{
    timestamps: true,
    }
    );

//HASHING
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        try{
            this.password = await argon2.hash(this.password);

        }catch(err){2
            return next(err);
        }
    }
})

//COMPARES
userSchema.methods.comparePassword = async function (candidatePassword) {
    try{
        return await argon2.verify(this.password, candidatePassword);
    }catch(err){
        throw err;
    }
}

userSchema.index({username : 'text'});

const User = mongoose.model('User', userSchema);
module.exports = User;