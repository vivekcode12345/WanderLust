const Listing=require("../models/listing");
const Review=require("../models/review");


module.exports.createReview=async(req,res)=>{
    let id = req.params.id.trim(); // if there is any leading space problem in the code 
    let listing = await Listing.findById(id);
    
    let reviewData = req.body.review || req.body;
    let newReview= new Review(reviewData);
    newReview.author=req.user._id;
    listing.reviews.push(newReview._id);
    await newReview.save();
   
    await listing.save();
    req.flash("success","Review created successfully");
    res.redirect(`/listings/${listing._id}`);
}

module.exports.destroyReview=async(req,res)=>{
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review deleted successfully");
    res.redirect(`/listings/${id}`);
};

