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

const sendWithRetry = async (mailOptions, errorPrefix) => {
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
    `${errorPrefix}${lastError?.code ? ` (${lastError.code})` : ""}`,
    500
  );
};

const sendOtpEmail = async (email, otp) => {
  const sender = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mailOptions = {
    from: sender,
    to: email,
    subject: "Taskflow Email Verification OTP",
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  await sendWithRetry(mailOptions, "Failed to send OTP email");
};

const sendProjectInviteEmail = async ({ email, inviterName, projectName, acceptUrl }) => {
  const sender = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const safeInviter = inviterName || "Project admin";
  const safeProject = projectName || "TaskFlow Project";

  const mailOptions = {
    from: sender,
    to: email,
    subject: `Invitation to join ${safeProject}`,
    text: `${safeInviter} invited you to join "${safeProject}". Accept invite: ${acceptUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Project Invitation</h2>
        <p><strong>${safeInviter}</strong> invited you to join <strong>${safeProject}</strong>.</p>
        <p style="margin: 16px 0;">
          <a href="${acceptUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
            Accept Invitation
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${acceptUrl}">${acceptUrl}</a></p>
      </div>
    `,
  };

  await sendWithRetry(mailOptions, "Failed to send project invite email");
};

const sendTaskDueReminderEmail = async ({
  email,
  assigneeName,
  taskTitle,
  projectName,
  dueDate,
  isOverdue,
}) => {
  const sender = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const dueText = dueDate ? new Date(dueDate).toLocaleString() : "soon";
  const safeAssignee = assigneeName || "Teammate";
  const safeTask = taskTitle || "Task";
  const safeProject = projectName || "Project";
  const subject = isOverdue
    ? `Overdue Task: ${safeTask}`
    : `Task Reminder: ${safeTask}`;

  const text = isOverdue
    ? `Hi ${safeAssignee}, task "${safeTask}" in "${safeProject}" is overdue (due: ${dueText}).`
    : `Hi ${safeAssignee}, task "${safeTask}" in "${safeProject}" is due by ${dueText}.`;

  const mailOptions = {
    from: sender,
    to: email,
    subject,
    text,
  };

  await sendWithRetry(mailOptions, "Failed to send task reminder email");
};

module.exports = {
  sendOtpEmail,
  sendProjectInviteEmail,
  sendTaskDueReminderEmail,
};
