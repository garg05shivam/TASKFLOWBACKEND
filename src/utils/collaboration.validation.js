const { body, param } = require("express-validator");

const projectIdValidation = [param("projectId").isMongoId().withMessage("Invalid project ID")];
const taskIdValidation = [param("taskId").isMongoId().withMessage("Invalid task ID")];
const memberIdValidation = [param("memberId").isMongoId().withMessage("Invalid member ID")];
const notificationIdValidation = [param("id").isMongoId().withMessage("Invalid notification ID")];

const addMemberValidation = [
  ...projectIdValidation,
  body("email").isEmail().withMessage("Valid email is required"),
];

const acceptInviteValidation = [
  body("token")
    .isLength({ min: 20 })
    .withMessage("Invitation token is required"),
];

const commentValidation = [
  ...taskIdValidation,
  body("text")
    .isLength({ min: 1, max: 1200 })
    .withMessage("Comment text is required and must be under 1200 chars"),
];

const messageValidation = [
  ...projectIdValidation,
  body("text")
    .isLength({ min: 1, max: 1500 })
    .withMessage("Message text is required and must be under 1500 chars"),
];

module.exports = {
  acceptInviteValidation,
  addMemberValidation,
  commentValidation,
  memberIdValidation,
  messageValidation,
  notificationIdValidation,
  projectIdValidation,
  taskIdValidation,
};
