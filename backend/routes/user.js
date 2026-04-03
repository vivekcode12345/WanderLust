const express=require ("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport=require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const rateLimit = require('express-rate-limit');

const userController=require("../controllers/user.js");

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.'
});

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup)
);

router.route("/login")
    .get(userController.renderLoginForm)
    .post(loginLimiter, saveRedirectUrl, passport.authenticate("local",{
            failureRedirect:"/login",
            failureFlash:true
        }),userController.login
);

router.get("/logout",userController.logout);

// Password Reset Routes
router.route("/forgot-password")
    .get(userController.renderForgotPasswordForm)
    .post(wrapAsync(userController.forgotPassword));

router.route("/reset-password/:token")
    .get(wrapAsync(userController.renderResetPasswordForm))
    .post(wrapAsync(userController.resetPassword));

// Favorites Routes
router.post("/favorites/:listingId", isLoggedIn, wrapAsync(userController.addToFavorites));
router.delete("/favorites/:listingId", isLoggedIn, wrapAsync(userController.removeFromFavorites));
router.get("/favorites", isLoggedIn, wrapAsync(userController.viewFavorites));

// Dashboard Route
router.get("/dashboard", isLoggedIn, wrapAsync(userController.viewDashboard));

module.exports=router;