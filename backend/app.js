require("dotenv").config();

const PORT = process.env.PORT || 8080;
const SKIP_DB = process.env.SKIP_DB === "true";
const SESSION_SECRET = process.env.SECRET || "change-this-secret";

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");// to set ejs directory
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");// to use ejs as a template engine
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");


const listingRouter = require("./routes/listing.js");
const bookingRouter = require("./routes/booking.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


const dbUrl = process.env.ATLASDB_URL;

function validateMongoUri(uri) {
    if (!uri) {
        return { valid: false, reason: "ATLASDB_URL is missing." };
    }

    const isMongoScheme = uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
    if (!isMongoScheme) {
        return { valid: false, reason: "ATLASDB_URL must start with mongodb:// or mongodb+srv://." };
    }

    if (!uri.includes("@")) {
        return { valid: false, reason: "ATLASDB_URL seems malformed (missing credentials/host separator '@')." };
    }

    return { valid: true };
}

async function connectDB() {
    if (SKIP_DB) {
        console.log("Skipping DB connection (SKIP_DB=true)");
        return;
    }

    const uriCheck = validateMongoUri(dbUrl);
    if (!uriCheck.valid) {
        throw new Error(uriCheck.reason);
    }

    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "frontend", "views"));// set the views directory

// Security Middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: ["'self'", "https://api.mapbox.com"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net",
                    "https://api.mapbox.com"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.googleapis.com",
                    "https://api.mapbox.com"
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https://res.cloudinary.com",
                    "https://picsum.photos",
                    "https://fastly.picsum.photos",
                    "https://images.unsplash.com",
                    "https://plus.unsplash.com"
                ],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "https://cdnjs.cloudflare.com"
                ],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: []
            }
        }
    })
);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // allow normal browsing + assets + auth flow without accidental blocking
    skip: (req) => req.path === "/health",
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.',
    skip: (req) => req.method !== 'POST'
});

app.use(express.urlencoded({extended:true}));// to parse form data
app.use(express.json());

app.use(methodOverride("_method"));// to use PUT and DELETE methods in forms
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"..","frontend","public")));// to serve static files

if (!process.env.SECRET) {
    console.warn("SECRET is not set; using fallback secret for this process.");
}

let store;
if (!SKIP_DB) {
    store = MongoStore.create({
        mongoUrl: dbUrl,
        crypto: {
            secret: SESSION_SECRET,
        },
        touchAfter: 24 * 60 * 60, // time period in seconds
    });

    store.on("error", function (err) {
        console.log("session store error", err);
    });
}

const sessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,//for seven days
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true, // client side js cannot access the cookie
    }
};

if (store) {
    sessionOptions.store = store;
}

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user || null;
    next();
});


// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"fakeuser@example.com",
//         username:"fakeuser",
//     });
//     let registeredUser= await User.register(fakeUser,"chicken");
//     res.send(registeredUser);
// })


app.use("/listings", listingRouter);
app.use("/bookings", bookingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.get("/health", (req, res) => {
    return res.status(200).json({
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        db: {
            skipped: SKIP_DB,
            connected: mongoose.connection.readyState === 1,
            readyState: mongoose.connection.readyState
        },
        aiConfigured: Boolean(process.env.GROQ_API_KEY)
    });
});

app.get("/", (req, res) => {
    res.redirect("/listings");
});

// 404 Not Found Handler
app.all("/*splat", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    
    // Render appropriate error page
    if(statusCode === 404) {
        res.status(statusCode).render("error404.ejs", { message });
    } else {
        res.status(statusCode).render("error500.ejs", { message });
    }
});


async function startServer() {
    try {
        await connectDB();
        if (!SKIP_DB) {
            console.log("connected to db");
        }
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;