const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cookieparser = require('cookie-parser');
const uploadRouter = require("./routes/uploadRoutes")
const userRouter = require("./routes/user.route")

const cors = require('cors');
const connectDB = require('./db/db'); 
app.use(cors());

app.use(cookieparser());
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', userRouter);
app.use('/uploads', uploadRouter);

app.get('/', (req, res) => {
    res.send('Hello World');
});


module.exports = app;