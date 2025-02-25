const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cookieparser = require('cookie-parser');
const uploadRouter = require("./routes/uploadRoutes")
const userRouter = require("./routes/user.route")
const connectDB = require('./db/db'); 
const cors = require('cors');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true  // Allow cookies if needed
}));


app.use(cookieparser());
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRouter);
app.use('/uploads', uploadRouter);

app.get('/', (req, res) => {
    res.send('Hello World');
});

module.exports = app;