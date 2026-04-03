const express=require ("express");
const router=express.Router();
const wrapAsync= require("../utils/wrapAsync.js");

const Listing=require("../models/listing.js");
const {isLoggedIn, isOwner, isAdmin, validateListing}=require("../middleware.js");

const listingControllers= require("../controllers/listing.js");
const bookingControllers = require("../controllers/booking.js");
const multer= require('multer');
const {storage}=require("../cloudConfig.js")
const upload=multer({storage});

router.route("/")
    .get(wrapAsync(listingControllers.index))
    .post(
        isAdmin,
        upload.single('listing[image]'),
        validateListing,
        wrapAsync(listingControllers.createListing));

router.post(
    "/ai/description",
    isAdmin,
    wrapAsync(listingControllers.generateAIDescription)
);
// New route to show form to create a new listing

router.get("/new",isAdmin,listingControllers.renderNewForm)

router.get(
    "/:id/book",
    isLoggedIn,
    wrapAsync(bookingControllers.renderBookingForm)
);

router.post(
    "/:id/book",
    isLoggedIn,
    wrapAsync(bookingControllers.createBooking)
);

router.route("/:id")
    .get(wrapAsync(listingControllers.showListing))
    .put(
        isAdmin,
        isOwner,
        upload.single('listing[image]'),
        validateListing,
        wrapAsync(listingControllers.updateListing)
    )
    .delete(isAdmin,isOwner, wrapAsync(listingControllers.destroyListing)
);


//Edit route to show form to edit a listing
router.get("/:id/edit",isAdmin,isOwner, wrapAsync(listingControllers.renderEditForm));

module.exports=router;