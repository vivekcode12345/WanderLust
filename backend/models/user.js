const mongoose =require("mongoose");
const Schema= mongoose.Schema;
const passportLocalMongoosee=require("passport-local-mongoose");

const userSchema=new Schema({
    email: {
        type: String,
        required:true,
        unique: true,
        index: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    favorites: [{
        type: Schema.Types.ObjectId,
        ref: "Listing"
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date
})

userSchema.plugin(passportLocalMongoosee);

module.exports= mongoose.model("User",userSchema);