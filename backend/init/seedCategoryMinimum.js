require("dotenv").config();

const mongoose = require("mongoose");
const Listing = require("../models/listing");
const User = require("../models/user");

const categories = [
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
];

const categoryData = {
  Trending: {
    baseTitle: "Popular Stay",
    description: "A high-demand stay loved by guests for comfort, location, and overall value.",
    locations: [
      ["Jaipur", "India", [75.7873, 26.9124]],
      ["Mumbai", "India", [72.8777, 19.0760]],
      ["Delhi", "India", [77.1025, 28.7041]],
      ["Pune", "India", [73.8567, 18.5204]],
      ["Kolkata", "India", [88.3639, 22.5726]]
    ]
  },
  Rooms: {
    baseTitle: "Comfort Room",
    description: "A neat private room with cozy bedding, clean interiors, and essential amenities.",
    locations: [
      ["Chennai", "India", [80.2707, 13.0827]],
      ["Hyderabad", "India", [78.4867, 17.3850]],
      ["Ahmedabad", "India", [72.5714, 23.0225]],
      ["Surat", "India", [72.8311, 21.1702]],
      ["Lucknow", "India", [80.9462, 26.8467]]
    ]
  },
  "Iconic Cities": {
    baseTitle: "City Landmark Stay",
    description: "Stay near famous city landmarks with easy access to local culture, food, and shopping.",
    locations: [
      ["Paris", "France", [2.3522, 48.8566]],
      ["Rome", "Italy", [12.4964, 41.9028]],
      ["London", "United Kingdom", [-0.1276, 51.5072]],
      ["Tokyo", "Japan", [139.6917, 35.6895]],
      ["Dubai", "United Arab Emirates", [55.2708, 25.2048]]
    ]
  },
  Mountains: {
    baseTitle: "Mountain Escape",
    description: "Fresh mountain air, valley views, and a peaceful atmosphere for your perfect retreat.",
    locations: [
      ["Manali", "India", [77.1887, 32.2396]],
      ["Shimla", "India", [77.1734, 31.1048]],
      ["Nainital", "India", [79.4591, 29.3919]],
      ["Gangtok", "India", [88.6065, 27.3389]],
      ["Leh", "India", [77.5770, 34.1526]]
    ]
  },
  Castles: {
    baseTitle: "Castle Heritage Stay",
    description: "Historic architecture with royal charm, ideal for travelers who love timeless places.",
    locations: [
      ["Edinburgh", "United Kingdom", [-3.1883, 55.9533]],
      ["Prague", "Czech Republic", [14.4378, 50.0755]],
      ["Salzburg", "Austria", [13.0458, 47.8095]],
      ["Budapest", "Hungary", [19.0402, 47.4979]],
      ["Krakow", "Poland", [19.9449, 50.0647]]
    ]
  },
  "Amazing Pools": {
    baseTitle: "Poolside Villa",
    description: "Relax in a stylish property featuring a private or shared premium pool experience.",
    locations: [
      ["Goa", "India", [73.7615, 15.2993]],
      ["Phuket", "Thailand", [98.3381, 7.8804]],
      ["Bali", "Indonesia", [115.1889, -8.4095]],
      ["Maldives", "Maldives", [73.2207, 3.2028]],
      ["Ibiza", "Spain", [1.4320, 38.9067]]
    ]
  },
  Camping: {
    baseTitle: "Campground Stay",
    description: "A nature-first camping experience with open skies, bonfire vibes, and outdoor fun.",
    locations: [
      ["Rishikesh", "India", [78.2676, 30.0869]],
      ["Jaisalmer", "India", [70.9083, 26.9157]],
      ["Coorg", "India", [75.8069, 12.3375]],
      ["Kasol", "India", [77.3152, 32.0094]],
      ["Spiti", "India", [78.0416, 32.2462]]
    ]
  },
  Farms: {
    baseTitle: "Farmhouse Retreat",
    description: "A rustic farmhouse stay with greenery, open spaces, and a slow countryside lifestyle.",
    locations: [
      ["Nashik", "India", [73.7898, 19.9975]],
      ["Anand", "India", [72.9289, 22.5645]],
      ["Mysuru", "India", [76.6394, 12.2958]],
      ["Ludhiana", "India", [75.8573, 30.9010]],
      ["Nagpur", "India", [79.0882, 21.1458]]
    ]
  },
  Arctic: {
    baseTitle: "Snowland Cabin",
    description: "A winter-themed stay with frosty landscapes and cozy heated interiors.",
    locations: [
      ["Reykjavik", "Iceland", [-21.8174, 64.1265]],
      ["Tromso", "Norway", [18.9553, 69.6492]],
      ["Rovaniemi", "Finland", [25.7294, 66.5039]],
      ["Nuuk", "Greenland", [-51.7214, 64.1835]],
      ["Longyearbyen", "Svalbard", [15.6267, 78.2232]]
    ]
  },
  Domes: {
    baseTitle: "Dome Stay",
    description: "A unique dome accommodation with panoramic views and a modern minimalist feel.",
    locations: [
      ["Wadi Rum", "Jordan", [35.4444, 29.5733]],
      ["Aqaba", "Jordan", [35.0078, 29.5321]],
      ["Merzouga", "Morocco", [-4.0147, 31.0994]],
      ["Atacama", "Chile", [-68.2011, -22.9100]],
      ["Nevada Desert", "United States", [-116.4194, 38.8026]]
    ]
  },
  Boats: {
    baseTitle: "Houseboat Escape",
    description: "A waterfront stay on a beautifully designed boat with peaceful sunrise and sunset views.",
    locations: [
      ["Alleppey", "India", [76.3388, 9.4981]],
      ["Amsterdam", "Netherlands", [4.9041, 52.3676]],
      ["Venice", "Italy", [12.3155, 45.4408]],
      ["Stockholm", "Sweden", [18.0686, 59.3293]],
      ["Copenhagen", "Denmark", [12.5683, 55.6761]]
    ]
  }
};

function imageUrl(category, idx) {
  return `https://picsum.photos/seed/${encodeURIComponent(category)}-${idx}/1200/800`;
}

async function run() {
  await mongoose.connect(process.env.ATLASDB_URL);

  const admin = await User.findOne({ isAdmin: true });
  if (!admin) {
    throw new Error("No admin user found.");
  }

  let insertedTotal = 0;

  for (const category of categories) {
    const existingCount = await Listing.countDocuments({ category });
    const needed = Math.max(0, 5 - existingCount);

    if (needed === 0) {
      continue;
    }

    const conf = categoryData[category];
    const docs = [];

    for (let i = 0; i < needed; i++) {
      const locTuple = conf.locations[(existingCount + i) % conf.locations.length];
      const location = locTuple[0];
      const country = locTuple[1];
      const coordinates = locTuple[2];

      docs.push({
        title: `${conf.baseTitle} ${existingCount + i + 1}`,
        description: conf.description,
        image: {
          url: imageUrl(category, existingCount + i + 1),
          filename: `seed/${category.toLowerCase().replace(/\s+/g, "-")}-${existingCount + i + 1}`
        },
        price: 2500 + ((existingCount + i + 1) * 350),
        location,
        country,
        category,
        geometry: {
          type: "Point",
          coordinates
        },
        owner: admin._id
      });
    }

    if (docs.length > 0) {
      await Listing.insertMany(docs);
      insertedTotal += docs.length;
    }
  }

  const counts = {};
  for (const category of categories) {
    counts[category] = await Listing.countDocuments({ category });
  }

  console.log("Inserted listings:", insertedTotal);
  console.log(JSON.stringify(counts, null, 2));

  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error(err.message);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
