const mongoose= require('mongoose');
const Schema = mongoose.Schema;
const Review=require("./review.js")

const listingSchema= new Schema({
    title:{
        type:String,
        required:true,
    },
    description:String,
    image: {
        url: String,
        filename: String,
    },
    price:Number,  
    location:String,
    country:String,
    category: {
      type: String,
      enum: [
        "Trending",
        "Rooms",
        "Iconic Cities",
        "Mountains",
        "Castles",
        "Amazing Pools",
        "Camping",
        "Farms",
        "Arctic",
        "Domes",
        "Boats"
      ],
      default: "Trending"
    },
    reviews:[
      {
        type:Schema.Types.ObjectId,
        ref:"Review",
      }
    ],
    owner:{
      type:Schema.Types.ObjectId,
      ref:"User",
    },
    geometry:{
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
  },
    createdAt: {
      type: Date,
      default: Date.now
    }
});
listingSchema.post("findOneAndDelete", async (listing) => {
  if(listing){
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

// Create indexes for better query performance
listingSchema.index({ title: 'text', description: 'text', location: 'text' });
listingSchema.index({ owner: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ country: 1 });
listingSchema.index({ category: 1 });
listingSchema.index({ createdAt: -1 });

const Listing=mongoose.model("Listing",listingSchema); 
module.exports=Listing;