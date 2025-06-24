const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Login-tut", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("Database Connected Successfully");
})
.catch((err) => {
    console.error("Database connection failed:", err);
});

// Define Mongoose schema
const Loginschema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    lastlogin: {
        type: String,
        required: false
    }
});

// Fix: use correct variable name in export
const Users = mongoose.model("Users", Loginschema);
module.exports = Users;
