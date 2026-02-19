const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require("../models/otp.model");
const generateOtp = require("../utils/generateOtp");
const { sendOtpEmail } = require("./email.service");


const registerUser = async (data) => {
  const { name, email, password } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const otp = generateOtp();

  await Otp.create({
    user: user._id,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
  });

  await sendOtpEmail(email, otp);

  return {
    message: "User registered successfully. OTP sent to email.",
  };
};

const loginUser = async (data) => {
  const { email, password } = data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }


  if (!user.isVerified) {
    throw new Error("Please verify your email first");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  return { user, token };
};


const verifyOtp = async (data) => {
  const { email, otp } = data;

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  const otpRecord = await Otp.findOne({
    user: user._id,
    otp,
  });

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  user.isVerified = true;
  await user.save();

  // Delete all OTPs after verification
  await Otp.deleteMany({ user: user._id });

  return {
    message: "Account verified successfully",
  };
};


module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
};
