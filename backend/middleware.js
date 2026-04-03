const Listing=require("./models/listing");
const Review=require("./models/review");
const ExpressError=require("./utils/ExpressError.js")
const {listingSchema,reviewSchema}=require("./schema.js");


module.exports.isLoggedIn = (req, res, next) => {
       
    if(!req.isAuthenticated()){
        //redirectUrl saves the url which user was trying to access before being redirected to login
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You must be signed in to create a new listing");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner= async (req,res,next)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id);
    if (res.locals.currentUser?.isAdmin) {
        return next();
    }
    if(!listing.owner.equals(res.locals.currentUser._id)){
        req.flash("error","You are not authorized to do that");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || !res.locals.currentUser?.isAdmin) {
        req.flash("error", "Only admin can add, edit, or delete listings.");
        return res.redirect("/listings");
    }
    next();
};

module.exports.validateListing=(req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        let errMsg= error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400,errMsg)
    }else{
        next();
    }
}

module.exports.validateReview=(req,res,next)=>{
    let {error}=reviewSchema.validate(req.body);
    if(error){
        let errMsg= error.details.map((el)=> el.message).join(",");
        throw new ExpressError(400,errMsg)
    }else{
        next();
    }
}

module.exports.isReviewAuthor= async (req,res,next)=>{
    let {id,reviewId}=req.params;
    let review=await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currentUser._id)){
        req.flash("error","You are not authorized to do that");
        return res.redirect(`/listings/${id}`);
    }
    next();
}