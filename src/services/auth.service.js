const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require("../models/otp.model");
const generateOtp = require("../utils/generateOtp");
const { sendOtpEmail } = require("./email.service");
const AppError = require("../utils/appError");


// REGISTER USER
const registerUser = async (data) => {
  const { name, email, password } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError("Email already registered", 400);
    }

    const otp = generateOtp();
    await Otp.deleteMany({ user: existingUser._id });
    await Otp.create({
      user: existingUser._id,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(normalizedEmail, otp);
    return {
      message: "Account already exists but is unverified. New OTP sent to email.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
  });

  const otp = generateOtp();

  await Otp.create({
    user: user._id,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  try {
    await sendOtpEmail(normalizedEmail, otp);
  } catch (error) {
    await Otp.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });
    throw new AppError("Failed to send OTP email. Please try again.", 500);
  }

  return {
    message: "User registered successfully. OTP sent to email.",
  };
};


// LOGIN USER 
const loginUser = async (data) => {
  const { email, password } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email first", 401);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  return { user, token };
};


//  VERIFY OTP 
const verifyOtp = async (data) => {
  const { email, otp } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const otpRecord = await Otp.findOne({
    user: user._id,
    otp,
  });

  if (!otpRecord) {
    throw new AppError("Invalid OTP", 400);
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new AppError("OTP expired", 400);
  }

  user.isVerified = true;
  await user.save();

  await Otp.deleteMany({ user: user._id });

  return {
    message: "Account verified successfully",
  };
};

const resendOtp = async (data) => {
  const { email } = data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("User is already verified", 400);
  }

  const otp = generateOtp();
  await Otp.deleteMany({ user: user._id });
  await Otp.create({
    user: user._id,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendOtpEmail(normalizedEmail, otp);

  return {
    message: "New OTP sent to email.",
  };
};


module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
};
