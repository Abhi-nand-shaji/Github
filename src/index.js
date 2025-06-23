require('dotenv').config(); // Loading  environment variables

const express = require("express");
const path = require("path");
const jwt = require('jsonwebtoken');
const Users = require("./config"); // Mongoose model
const bcrypt = require('bcrypt');

//middleware for validating Signup
const {body, validationResult} = require('express-validator');

const validateSignUp = [
    body('username').isLength({min:5}).withMessage("Username must be at least 5 characters in Length"),
    body('password').isLength({min:6}).withMessage("Password must be atleast 6 characters in Length"),
    body('dob').notEmpty().withMessage("Date of Birth is required"),
    body('mobile').isMobilePhone().withMessage("Invalid Mobile Number"),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()})
        }
        next();
    }
];

const app = express();

app.use(express.json());//why json?

app.use(express.static("public"));//why do you call it static?

app.use(express.urlencoded({ extended: false }));//what does this line do?

app.set("view engine", "ejs");

app.get("/", (req, res) => { //login page routing
    res.render("login", { error: null });
});

app.get("/signup", (req, res) => { //signup page routing
    res.render("signup");
});


app.post("/signup", validateSignUp, async (req, res) => {
  try {
    console.log("Signup request body:", req.body);

    const { username, dob, mobile, password } = req.body;
    const existingUser = await Users.findOne({ username });
    if (existingUser) {
      console.log("Signup error: user exists");
      return res.send('User already exists. Please choose a different username.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Users.create({ username, dob, mobile, password: hashedPassword });

    console.log("User created:", newUser);
    return res.redirect("/");

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).send("Internal Server Error");
  }
});



// Login user 
app.post("/login", async (req, res) => {
    try {
        if(!req.body.username || !req.body.password) { //return res.json('please enter username/password');
             return res.render("login", {error:'User cannot be found!'}); }
        const check = await Users.findOne({ username: req.body.username });
        if (!check) {
            //return res.json("User name cannot be found")
            return res.render("login", {error:"User cannot be found!"});
        }
        // Compare the hashed password from the database with the plaintext password
        
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            //return res.send("wrong Password");
            return res.render("login", { error: 'Wrong password' });
        }

        const logintime = Date();

        await Users.updateOne(
            {username : req.body.username},
            {$set: {lastlogin: logintime}}
        )

        console.log(`User ${req.body.username} logged in at ${logintime}`);
        const token = jwt.sign({ username: req.body.username, id: check._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.redirect(`/home?token=${token}`);

    }
    catch (err) {
        console.error(err);
        //return res.send("wrong Details");
        return res.render("login", {error:"Wrong Details"});
        
    }
});

//middleware to verify token
function verifyToken(req, res, next) {
    const token = req.query.token;

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}


// Protected Route
app.get("/home", verifyToken, (req, res) => {
    res.send(`Welcome ${req.user.username}! You are now inside the protected route.`);
});

// Define Port for Applicationfs
const port = 5000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});