const nodemailer = require("nodemailer");
const AppError = require("../utils/appError");

const RETRYABLE_CODES = new Set(["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ECONNRESET"]);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildTransport = () => {
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
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
};

const sendOtpEmail = async (email, otp) => {
  const sender = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mailOptions = {
    from: sender,
    to: email,
    subject: "Taskflow Email Verification OTP",
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const transporter = buildTransport();

    try {
      await transporter.verify();
      await transporter.sendMail(mailOptions);
      return;
    } catch (error) {
      lastError = error;

      console.error("MAIL ERROR:", {
        attempt,
        message: error.message,
        code: error.code,
        response: error.response,
        command: error.command,
      });

      if (!RETRYABLE_CODES.has(error.code) || attempt === 3) {
        break;
      }

      await delay(2500);
    }
  }

  throw new AppError(
    `Failed to send OTP email${lastError?.code ? ` (${lastError.code})` : ""}`,
    500
  );
};

module.exports = { sendOtpEmail };
