require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/user');
const Listing = require('../models/listing');
const Review = require('../models/review');
const Booking = require('../models/booking');

async function main() {
  await mongoose.connect(process.env.ATLASDB_URL);

  const adminUsers = await User.find({ isAdmin: true }, '_id username email').lean();
  const guestUsers = await User.find({ isAdmin: { $ne: true } }, '_id username email').lean();
  const guestIds = guestUsers.map((u) => u._id);

  if (guestIds.length === 0) {
    console.log('No guest users found. Nothing to delete.');
    console.log(`Admins kept: ${adminUsers.length}`);
    await mongoose.connection.close();
    return;
  }

  const guestListings = await Listing.find({ owner: { $in: guestIds } }, '_id reviews').lean();
  const guestListingIds = guestListings.map((l) => l._id);

  const reviewIdsFromGuestListings = guestListings.flatMap((l) => l.reviews || []);
  const guestAuthoredReviews = await Review.find({ author: { $in: guestIds } }, '_id').lean();
  const guestAuthoredReviewIds = guestAuthoredReviews.map((r) => r._id);
  const allReviewIdsToRemove = [
    ...reviewIdsFromGuestListings,
    ...guestAuthoredReviewIds
  ];

  const deletedReviewsByGuest = await Review.deleteMany({ author: { $in: guestIds } });

  if (reviewIdsFromGuestListings.length > 0) {
    await Review.deleteMany({ _id: { $in: reviewIdsFromGuestListings } });
  }

  if (allReviewIdsToRemove.length > 0) {
    await Listing.updateMany(
      {},
      { $pull: { reviews: { $in: allReviewIdsToRemove } } }
    );
  }

  const deletedGuestListings = await Listing.deleteMany({ _id: { $in: guestListingIds } });

  const deletedGuestBookings = await Booking.deleteMany({
    $or: [
      { guest: { $in: guestIds } },
      { host: { $in: guestIds } }
    ]
  });

  const deletedGuests = await User.deleteMany({ _id: { $in: guestIds } });

  const adminsAfter = await User.countDocuments({ isAdmin: true });
  const guestsAfter = await User.countDocuments({ isAdmin: { $ne: true } });

  console.log('Cleanup complete');
  console.log(`Admins kept: ${adminsAfter}`);
  console.log(`Guests deleted: ${deletedGuests.deletedCount}`);
  console.log(`Guest-authored reviews deleted: ${deletedReviewsByGuest.deletedCount}`);
  console.log(`Guest-owned listings deleted: ${deletedGuestListings.deletedCount}`);
  console.log(`Guest-related bookings deleted: ${deletedGuestBookings.deletedCount}`);
  console.log(`Guests remaining: ${guestsAfter}`);

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('Cleanup failed:', err.message);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
