const Booking = require("../models/booking");
const Listing = require("../models/listing");
const transporter = require("../mailConfig");

function parseDate(dateValue) {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function calculateNights(checkInDate, checkOutDate) {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const millisecondsPerNight = 1000 * 60 * 60 * 24;
  const nights = Math.ceil((end - start) / millisecondsPerNight);
  return nights;
}

async function sendMailIfConfigured(mailOptions) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Booking email failed:", error.message);
  }
}

module.exports.renderBookingForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  if (listing.owner._id.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing");
    return res.redirect(`/listings/${id}`);
  }

  res.render("bookings/new.ejs", { listing });
};

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  if (listing.owner._id.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing");
    return res.redirect(`/listings/${id}`);
  }

  const checkInDate = parseDate(req.body.booking.checkInDate);
  const checkOutDate = parseDate(req.body.booking.checkOutDate);
  const guests = Number(req.body.booking.guests || 1);
  const notes = req.body.booking.notes || "";

  if (!checkInDate || !checkOutDate) {
    req.flash("error", "Please provide valid check-in and check-out dates");
    return res.redirect(`/listings/${id}/book`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(checkInDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(checkOutDate);
  end.setHours(0, 0, 0, 0);

  if (start < today) {
    req.flash("error", "Check-in date cannot be in the past");
    return res.redirect(`/listings/${id}/book`);
  }

  if (end <= start) {
    req.flash("error", "Check-out date must be after check-in date");
    return res.redirect(`/listings/${id}/book`);
  }

  if (!Number.isInteger(guests) || guests < 1) {
    req.flash("error", "Guests must be at least 1");
    return res.redirect(`/listings/${id}/book`);
  }

  const overlappingBooking = await Booking.findOne({
    listing: listing._id,
    status: { $ne: "cancelled" },
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start },
  });

  if (overlappingBooking) {
    req.flash("error", "Those dates are already booked. Please choose different dates.");
    return res.redirect(`/listings/${id}/book`);
  }

  const totalNights = calculateNights(start, end);
  const totalPrice = totalNights * Number(listing.price || 0);

  const booking = new Booking({
    listing: listing._id,
    guest: req.user._id,
    host: listing.owner._id,
    checkInDate: start,
    checkOutDate: end,
    guests,
    totalNights,
    totalPrice,
    notes,
  });

  await booking.save();

  await sendMailIfConfigured({
    from: process.env.EMAIL_USER,
    to: req.user.email,
    subject: `Booking request received for ${listing.title}`,
    html: `
      <p>Your booking request has been created successfully.</p>
      <p><strong>Listing:</strong> ${listing.title}</p>
      <p><strong>Dates:</strong> ${start.toDateString()} to ${end.toDateString()}</p>
      <p><strong>Guests:</strong> ${guests}</p>
      <p><strong>Total:</strong> &#8377;${totalPrice.toLocaleString("en-IN")}</p>
      <p>Status: pending</p>
    `,
  });

  await sendMailIfConfigured({
    from: process.env.EMAIL_USER,
    to: listing.owner.email,
    subject: `New booking request for ${listing.title}`,
    html: `
      <p>You have received a new booking request.</p>
      <p><strong>Guest:</strong> ${req.user.username}</p>
      <p><strong>Listing:</strong> ${listing.title}</p>
      <p><strong>Dates:</strong> ${start.toDateString()} to ${end.toDateString()}</p>
      <p><strong>Guests:</strong> ${guests}</p>
      <p><strong>Total:</strong> &#8377;${totalPrice.toLocaleString("en-IN")}</p>
      <p>Please review it in the Manage Bookings page.</p>
    `,
  });

  req.flash("success", "Booking request created successfully");
  res.redirect("/bookings/me");
};

module.exports.viewMyBookings = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .populate("host")
    .sort({ createdAt: -1 });

  res.render("bookings/me.ejs", { bookings });
};

module.exports.viewManageBookings = async (req, res) => {
  const filter = req.user.isAdmin ? {} : { host: req.user._id };
  const bookings = await Booking.find(filter)
    .populate("listing")
    .populate("guest")
    .populate("host")
    .sort({ createdAt: -1 });

  res.render("bookings/manage.ejs", { bookings });
};

module.exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate("host").populate("guest").populate("listing");

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings/manage");
  }

  const isOwner = booking.host._id.equals(req.user._id);
  const isAdmin = req.user.isAdmin;
  if (!isOwner && !isAdmin) {
    req.flash("error", "You are not authorized to manage this booking");
    return res.redirect("/bookings/manage");
  }

  const nextStatus = req.body.status;
  if (!["pending", "confirmed", "cancelled"].includes(nextStatus)) {
    req.flash("error", "Invalid booking status");
    return res.redirect("/bookings/manage");
  }

  if (nextStatus === "confirmed") {
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      listing: booking.listing,
      status: "confirmed",
      checkInDate: { $lt: booking.checkOutDate },
      checkOutDate: { $gt: booking.checkInDate },
    });

    if (conflict) {
      req.flash("error", "This booking overlaps with an already confirmed booking.");
      return res.redirect("/bookings/manage");
    }
  }

  booking.status = nextStatus;
  await booking.save();

  await sendMailIfConfigured({
    from: process.env.EMAIL_USER,
    to: booking.guest.email,
    subject: `Your booking for ${booking.listing.title} is ${nextStatus}`,
    html: `
      <p>Your booking status has been updated.</p>
      <p><strong>Listing:</strong> ${booking.listing.title}</p>
      <p><strong>Status:</strong> ${nextStatus}</p>
      <p><a href="${process.env.APP_URL || 'http://localhost:8080'}/bookings/me">View your bookings</a></p>
    `,
  });

  req.flash("success", "Booking status updated");
  res.redirect("/bookings/manage");
};

module.exports.cancelMyBooking = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate("listing").populate("guest").populate("host");

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings/me");
  }

  if (!booking.guest.equals(req.user._id) && !req.user.isAdmin) {
    req.flash("error", "You are not authorized to cancel this booking");
    return res.redirect("/bookings/me");
  }

  booking.status = "cancelled";
  await booking.save();

  await sendMailIfConfigured({
    from: process.env.EMAIL_USER,
    to: booking.guest.email,
    subject: `Your booking for ${booking.listing.title} has been cancelled`,
    html: `
      <p>Your booking has been cancelled successfully.</p>
      <p><strong>Listing:</strong> ${booking.listing.title}</p>
      <p><strong>Dates:</strong> ${booking.checkInDate.toDateString()} to ${booking.checkOutDate.toDateString()}</p>
    `,
  });

  req.flash("success", "Booking cancelled");
  res.redirect("/bookings/me");
};
