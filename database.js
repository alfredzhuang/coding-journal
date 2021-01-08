let mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB, {useNewUrlPaerser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

let userSchema = new mongoose.Schema({
    email: String,
    password: String,
})

module.exports = userSchema;