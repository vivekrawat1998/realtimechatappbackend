const userModel = require("../Models/Usermodal");
const { validationResult } = require("express-validator");

module.exports.registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, email, password } = req.body;

  try {
    const isUserAlready = await userModel.findOne({ email });

    if (isUserAlready) {
      return res.status(400).json({ message: "User already exist" });
    }

    const hashedPassword = await userModel.hashPassword(password);

    const newUser = new userModel({
      fullname,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    const token = newUser.generateAuthToken();

    res.status(201).json({ token, newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports.LoginUser = async (req,res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {  email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');     

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = user.generateAuthToken();

    res.cookie('token', token);

    res.status(200).json({ token, user });
}