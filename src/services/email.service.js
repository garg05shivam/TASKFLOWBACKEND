const nodemailer = require("nodemailer");
const AppError = require("../utils/appError");

const buildTransport = () => {
  // Use explicit SMTP config if provided; fallback to Gmail service.
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const sendOtpEmail = async (email, otp) => {
  const transporter = buildTransport();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Taskflow Email Verification OTP",
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  try {
    await transporter.verify();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("MAIL ERROR:", {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
    });
    throw new AppError("Failed to send OTP email", 500);
  }
};

module.exports = { sendOtpEmail };
