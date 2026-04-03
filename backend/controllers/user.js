const User=require("../models/user");
const Listing=require("../models/listing");
const Booking=require("../models/booking");
const crypto = require('crypto');
const transporter = require("../mailConfig");

module.exports.renderSignupForm=(req,res)=>{
    res.render("users/signup.ejs");
}

module.exports.signup=async(req,res)=>{
    try{
        let{username,email,password}=req.body;
        const newUser=new User({email,username});
        const registeredUser=await User.register(newUser,password);
        console.log(registeredUser);
        req.login(registeredUser,(err)=>{
            if(err){
                return next(err);
            }
            req.flash("success","Welcome to WanderLust");
            res.redirect("/listings");
        });
        
    }catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
}

module.exports.renderLoginForm=(req,res)=>{
    res.render("users/login.ejs")
};

module.exports.login=async(req,res)=>{
    req.flash("success","Welcome back to WanderLust!");
    let redirectUrl=res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
} 

module.exports.logout=(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return  next(err); 
        }       
    })
    req.flash("success","Logged you out!");
    res.redirect("/listings");
};

// Forgot Password - Show form
module.exports.renderForgotPasswordForm = (req, res) => {
    res.render("users/forgot-password.ejs");
};

// Forgot Password - Send reset email
module.exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        
        if (!user) {
            req.flash("error", "No user found with that email address");
            return res.redirect("/forgot-password");
        }
        
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        
        await user.save();
        
        // Send email with reset link
        const resetUrl = `${process.env.APP_URL || 'http://localhost:8080'}/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request - Wanderlust',
            html: `
                <p>You requested a password reset for your Wanderlust account.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        
        req.flash("success", "Password reset link sent to your email");
        res.redirect("/login");
        
    } catch (err) {
        console.error(err);
        req.flash("error", "Error processing request. Please try again.");
        res.redirect("/forgot-password");
    }
};

// Reset Password - Show form
module.exports.renderResetPasswordForm = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired");
            return res.redirect("/forgot-password");
        }
        
        res.render("users/reset-password.ejs", { token: req.params.token });
    } catch (err) {
        req.flash("error", "Error processing request");
        res.redirect("/forgot-password");
    }
};

// Reset Password - Update password
module.exports.resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired");
            return res.redirect("/forgot-password");
        }
        
        if (req.body.password !== req.body.confirmPassword) {
            req.flash("error", "Passwords do not match");
            return res.redirect(`/reset-password/${req.params.token}`);
        }
        
        // Update password using setPassword method from passport-local-mongoose
        await user.setPassword(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();
        
        req.flash("success", "Your password has been reset successfully. Please log in.");
        res.redirect("/login");
        
    } catch (err) {
        console.error(err);
        req.flash("error", "Error resetting password");
        res.redirect(`/reset-password/${req.params.token}`);
    }
};

// Add to favorites
module.exports.addToFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const listingId = req.params.listingId;
        
        // Check if listing is already in favorites
        if (!user.favorites.includes(listingId)) {
            user.favorites.push(listingId);
            await user.save();
            req.flash("success", "Added to favorites");
        } else {
            req.flash("info", "Already in favorites");
        }
        
        res.redirect(`/listings/${listingId}`);
    } catch (err) {
        console.error(err);
        req.flash("error", "Error adding to favorites");
        res.redirect("/listings");
    }
};

// Remove from favorites
module.exports.removeFromFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const listingId = req.params.listingId;
        
        user.favorites = user.favorites.filter(id => !id.equals(listingId));
        await user.save();
        
        req.flash("success", "Removed from favorites");
        res.redirect(`/listings/${listingId}`);
    } catch (err) {
        console.error(err);
        req.flash("error", "Error removing from favorites");
        res.redirect("/listings");
    }
};

// View favorites
module.exports.viewFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favorites');
        res.render("users/favorites.ejs", { favoriteListings: user.favorites });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error loading favorites");
        res.redirect("/listings");
    }
};

// View user dashboard
module.exports.viewDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favorites');
        const userListings = await Listing.find({ owner: req.user._id });
        const myBookingsCount = await Booking.countDocuments({ guest: req.user._id });
        const managedBookingsCount = req.user.isAdmin
            ? await Booking.countDocuments({})
            : await Booking.countDocuments({ host: req.user._id });
        
        res.render("users/dashboard.ejs", { 
            user, 
            userListings,
            favoriteCount: user.favorites.length,
            myBookingsCount,
            managedBookingsCount
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error loading dashboard");
        res.redirect("/listings");
    }
};