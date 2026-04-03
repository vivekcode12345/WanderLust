require("dotenv").config();

const mongoose = require("mongoose");
const Listing = require("../models/listing");
const User = require("../models/user");
const { cloudinary } = require("../cloudConfig");

const categories = [
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
];

const places = [
  {
    title: "Sunset Villa Goa",
    description: "A premium beachside villa with private deck, breezy rooms, and sunset-facing views. Ideal for weekend stays and family holidays.",
    price: 7200,
    location: "Goa",
    country: "India",
    coordinates: [73.7615, 15.2993],
    imageSource: "https://picsum.photos/seed/goa-villa/1200/800"
  },
  {
    title: "Royal Haveli Udaipur",
    description: "Heritage-style haveli with lake views, spacious courtyard, and traditional interiors. Great for cultural travel and calm evenings.",
    price: 6500,
    location: "Udaipur",
    country: "India",
    coordinates: [73.6833, 24.5854],
    imageSource: "https://picsum.photos/seed/udaipur-haveli/1200/800"
  },
  {
    title: "Pine Retreat Manali",
    description: "Cozy mountain stay with wooden interiors and panoramic valley views. Perfect for snow season and remote work escapes.",
    price: 4800,
    location: "Manali",
    country: "India",
    coordinates: [77.1887, 32.2396],
    imageSource: "https://picsum.photos/seed/manali-retreat/1200/800"
  },
  {
    title: "Backwater Houseboat Alleppey",
    description: "Floating stay experience with local cuisine and peaceful backwater routes. A unique Kerala escape for couples and families.",
    price: 5900,
    location: "Alleppey",
    country: "India",
    coordinates: [76.3388, 9.4981],
    imageSource: "https://picsum.photos/seed/alleppey-boat/1200/800"
  },
  {
    title: "Tea Estate Cottage Munnar",
    description: "A scenic hillside cottage surrounded by tea plantations and misty weather. Ideal for slow travel and nature walks.",
    price: 4300,
    location: "Munnar",
    country: "India",
    coordinates: [77.0595, 10.0889],
    imageSource: "https://picsum.photos/seed/munnar-cottage/1200/800"
  },
  {
    title: "City View Loft Bangalore",
    description: "Modern loft in the heart of the city with high-speed Wi-Fi, workspace setup, and premium interiors for business travelers.",
    price: 5200,
    location: "Bengaluru",
    country: "India",
    coordinates: [77.5946, 12.9716],
    imageSource: "https://picsum.photos/seed/bangalore-loft/1200/800"
  },
  {
    title: "Cliffside Stay Mussoorie",
    description: "Hillside property with sunrise balcony, fireplace lounge, and fresh mountain air. Great for peaceful breaks and monsoon views.",
    price: 4600,
    location: "Mussoorie",
    country: "India",
    coordinates: [78.0747, 30.4598],
    imageSource: "https://picsum.photos/seed/mussoorie-cliff/1200/800"
  },
  {
    title: "Riverfront Bungalow Rishikesh",
    description: "Comfortable riverside bungalow with yoga deck and easy access to cafes and rafting points. Perfect for wellness + adventure mix.",
    price: 5100,
    location: "Rishikesh",
    country: "India",
    coordinates: [78.2676, 30.0869],
    imageSource: "https://picsum.photos/seed/rishikesh-river/1200/800"
  },
  {
    title: "Desert Camp Jaisalmer",
    description: "Luxury desert tents with cultural nights, dune experiences, and clear starry skies. A memorable Rajasthan stay.",
    price: 5600,
    location: "Jaisalmer",
    country: "India",
    coordinates: [70.9083, 26.9157],
    imageSource: "https://picsum.photos/seed/jaisalmer-camp/1200/800"
  },
  {
    title: "Lakeview Apartment Nainital",
    description: "Elegant apartment overlooking the lake with spacious rooms and easy market access. Suitable for family trips and long weekends.",
    price: 4700,
    location: "Nainital",
    country: "India",
    coordinates: [79.4591, 29.3919],
    imageSource: "https://picsum.photos/seed/nainital-lake/1200/800"
  }
];

async function seed() {
  await mongoose.connect(process.env.ATLASDB_URL);

  const admin = await User.findOne({ isAdmin: true });
  if (!admin) {
    throw new Error("No admin user found. Please make an admin first.");
  }

  const docsToInsert = [];

  for (const [index, place] of places.entries()) {
    const uploadResult = await cloudinary.uploader.upload(place.imageSource, {
      folder: "wanderlust_DEV"
    });

    docsToInsert.push({
      title: place.title,
      description: place.description,
      image: {
        url: uploadResult.secure_url,
        filename: uploadResult.public_id
      },
      price: place.price,
      location: place.location,
      country: place.country,
      category: categories[index] || "Trending",
      geometry: {
        type: "Point",
        coordinates: place.coordinates
      },
      owner: admin._id
    });
  }

  const inserted = await Listing.insertMany(docsToInsert);
  console.log(`Inserted ${inserted.length} listings for admin ${admin.username}`);

  await mongoose.connection.close();
}

seed().catch(async (err) => {
  console.error(err.message);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
