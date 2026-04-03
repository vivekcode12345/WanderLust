const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  guest: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkInDate: {
    type: Date,
    required: true,
  },
  checkOutDate: {
    type: Date,
    required: true,
  },
  guests: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  totalNights: {
    type: Number,
    required: true,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

bookingSchema.index({ guest: 1, createdAt: -1 });
bookingSchema.index({ host: 1, createdAt: -1 });
bookingSchema.index({ listing: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
