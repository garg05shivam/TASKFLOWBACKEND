const { body, param, query } = require("express-validator");

const isAttachmentUrlAllowed = (value) => {
  if (!value) return false;
  const text = String(value);
  return /^https?:\/\//i.test(text) || /^data:image\//i.test(text);
};

const attachmentValidation = body("attachments")
  .optional()
  .isArray()
  .withMessage("Attachments must be an array");

const createTaskValidation = [
  body("title").notEmpty().withMessage("Task title is required"),
  body("project").isMongoId().withMessage("Invalid project ID"),
  body("assignedTo").optional({ nullable: true }).isMongoId().withMessage("assignedTo must be a valid user ID"),
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("dueDate must be a valid date"),
  attachmentValidation,
  body("attachments.*.name").optional().notEmpty().withMessage("Attachment name is required"),
  body("attachments.*.url")
    .optional()
    .custom(isAttachmentUrlAllowed)
    .withMessage("Attachment url must be a http(s) URL or image data URL"),
];

const taskIdValidation = [param("id").isMongoId().withMessage("Invalid task ID")];

const updateTaskValidation = [
  ...taskIdValidation,
  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid task status"),
  body("assignedTo").optional({ nullable: true }).isMongoId().withMessage("assignedTo must be a valid user ID"),
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("dueDate must be a valid date"),
  attachmentValidation,
  body("attachments.*.name").optional().notEmpty().withMessage("Attachment name is required"),
  body("attachments.*.url")
    .optional()
    .custom(isAttachmentUrlAllowed)
    .withMessage("Attachment url must be a http(s) URL or image data URL"),
];

const taskQueryValidation = [
  query("project").isMongoId().withMessage("Invalid project ID"),
  query("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid task status"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

module.exports = {
  createTaskValidation,
  taskIdValidation,
  updateTaskValidation,
  taskQueryValidation,
};
