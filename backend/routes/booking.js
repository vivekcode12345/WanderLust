const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.get("/me", isLoggedIn, wrapAsync(bookingController.viewMyBookings));
router.get("/manage", isLoggedIn, wrapAsync(bookingController.viewManageBookings));
router.patch("/:id/status", isLoggedIn, wrapAsync(bookingController.updateBookingStatus));
router.patch("/:id/cancel", isLoggedIn, wrapAsync(bookingController.cancelMyBooking));

module.exports = router;
