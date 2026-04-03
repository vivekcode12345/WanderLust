const Listing=require("../models/listing");
const mbxGeocoding= require('@mapbox/mapbox-sdk/services/geocoding');
const Groq = require("groq-sdk");
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;
module.exports.index=async(req,res)=>{
    let filter = {};
    
    // Search by title or location
    if(req.query.search){
        filter.$or = [
            { title: { $regex: req.query.search, $options: 'i' } },
            { location: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    
    // Filter by price range
    if(req.query.minPrice || req.query.maxPrice){
        filter.price = {};
        if(req.query.minPrice){
            filter.price.$gte = parseFloat(req.query.minPrice);
        }
        if(req.query.maxPrice){
            filter.price.$lte = parseFloat(req.query.maxPrice);
        }
    }
    
    // Filter by country
    if(req.query.country){
        filter.country = req.query.country;
    }

    // Filter by category
    if(req.query.category){
        filter.category = req.query.category;
    }
    
    let allListings = await Listing.find(filter);
    
    // Handle sorting
    if(req.query.sort){
        if(req.query.sort === 'price-asc'){
            allListings.sort((a,b) => a.price - b.price);
        } else if(req.query.sort === 'price-desc'){
            allListings.sort((a,b) => b.price - a.price);
        } else if(req.query.sort === 'newest'){
            // Assuming we add createdAt field to model
            allListings.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }
    
    res.render("listings/index.ejs",{allListings, searchParams: req.query});
};

module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.generateAIDescription = async (req, res) => {
    if (!groqClient) {
        return res.status(500).json({
            error: "Groq API key is not configured on the server."
        });
    }

    const { title = "", location = "", country = "", price = "" } = req.body;

    const userPrompt = `Create a short, attractive travel listing description in 80-120 words.
Title: ${title}
Location: ${location}
Country: ${country}
Price per night: ${price}

Keep it clear, friendly, and realistic. Avoid emojis and hashtags.`;

    const completion = await groqClient.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 180,
        messages: [
            {
                role: "system",
                content: "You write polished travel accommodation descriptions for listing platforms."
            },
            {
                role: "user",
                content: userPrompt
            }
        ]
    });

    const description = completion.choices?.[0]?.message?.content?.trim();

    if (!description) {
        return res.status(502).json({ error: "AI did not return a description." });
    }

    return res.json({ description });
};

module.exports.showListing=(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id)
        .populate("owner")
        .populate({'path':'reviews','populate':{'path':'author'}});
    if(!listing){
        req.flash("error","Listing not found ");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing});
})

module.exports.createListing=(async (req,res)=>{
   // let {title,discription,price,location,country}=req.body;
    let response=await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
    .send()
    
    let url = req.file.path || req.file.secure_url || req.file.url;
    let filename=req.file.filename;
    const newListing=new Listing(req.body.listing); 
    newListing.owner=req.user._id;
    newListing.image={url,filename};
    newListing.geometry=response.body.features[0].geometry;

    let savedListing=await newListing.save();
    console.log(savedListing);

    req.flash("success","Listing created successfully");
    res.redirect("/listings");
})

module.exports.renderEditForm=(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing not found ");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image?.url || "";
    if (originalImageUrl) {
        originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");//to resize the image to width of 200 pixels
    }
    res.render("listings/edit.ejs",{listing,originalImageUrl});
});

module.exports.updateListing=(async (req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});//it allows you to directly pass the updated fields from the form to Mongoose — cleanly and efficiently.
    if(typeof req.file!=="undefined"){
        let url = req.file.path || req.file.secure_url || req.file.url;
        let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();
    }
    req.flash("success","Listing updated successfully");
    res.redirect(`/listings/${id}`);
});

module.exports.destroyListing=(async (req,res)=>{
    let {id}=req.params;
    let deletedListing= await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing deleted successfully");
    res.redirect("/listings"); 
})
