const mongoose = require('mongoose')
const crypto = require('crypto')
const { Schema } = mongoose

const bcrypt = require('bcryptjs')
const { type } = require('os')
const { log } = require('console')
const User = new Schema({
    firstName: {
        type: String,
        required: [true, "First Name is required"],
    },
    lastName: {
        type: String,
        required: [true, "Last Name is required"],
    },
    about: {
        type: String,
    },
    avatar: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        validate: {
            validator: function (email) {
                return String(email)
                    .toLowerCase()
                    .match(
                        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    );
            },
            message: (props) => `Email (${props.value}) is invalid!`,
        },
    },
    password: {
        type: String,
    },
    passwordConfirm: {
        type: String
    },
    passwordChangedAt: {
        type: Date,
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
    },
    otpExpiredTime: {
        type: Date,
    },
})

User.pre("save", async function (next) {
    console.log(this.otp)
    if (!this.isModified("otp") || !this.otp) {
        console.log('skip')
        return next();
    }
    console.log(this.otp.toString(), "FROM PRE SAVE HOOK");
    this.otp = await bcrypt.hash(this.otp.toString(), 12);
    next();
});


User.pre("save",async function (next) {
    console.log(this.isModified("password")) 
    if (!this.isModified("password") || !this.password) {
        console.log('skipPass')
        return next()};

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordChangedAt = Date.now() - 1000

    next();
});

User.methods.correctPassword = async function(candidatePass, userPass){
    return await bcrypt.compare(candidatePass, userPass)
}

User.methods.correctOTP = async function(candidateOTP, userOTP){
    return await bcrypt.compare(candidateOTP, userOTP)
}

User.methods.createResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000
    return resetToken
}

User.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        //   const changedTimeStamp = parseInt(
        //     this.passwordChangedAt.getTime() / 1000,
        //     10
        //   );
        return JWTTimeStamp < this.passwordChangedAt;
    }
    return false;
};

module.exports = mongoose.model('User', User)