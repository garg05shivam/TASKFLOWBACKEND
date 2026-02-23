const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  acceptInvitation,
  addProjectMember,
  createTaskComment,
  getNotifications,
  getProjectActivity,
  getProjectMembers,
  listProjectMessages,
  listTaskComments,
  markNotificationRead,
  removeProjectMember,
  sendProjectMessage,
} = require("../controllers/collaboration.controller");
const {
  acceptInviteValidation,
  addMemberValidation,
  commentValidation,
  memberIdValidation,
  messageValidation,
  notificationIdValidation,
  projectIdValidation,
  taskIdValidation,
} = require("../utils/collaboration.validation");

router.use(protect);

router.post("/invitations/accept", acceptInviteValidation, validate, acceptInvitation);

router.get("/projects/:projectId/members", projectIdValidation, validate, getProjectMembers);
router.post("/projects/:projectId/members", addMemberValidation, validate, addProjectMember);
router.delete(
  "/projects/:projectId/members/:memberId",
  [...projectIdValidation, ...memberIdValidation],
  validate,
  removeProjectMember
);

router.get("/projects/:projectId/activity", projectIdValidation, validate, getProjectActivity);

router.get("/tasks/:taskId/comments", taskIdValidation, validate, listTaskComments);
router.post("/tasks/:taskId/comments", commentValidation, validate, createTaskComment);

router.get("/projects/:projectId/chat", projectIdValidation, validate, listProjectMessages);
router.post("/projects/:projectId/chat", messageValidation, validate, sendProjectMessage);

router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", notificationIdValidation, validate, markNotificationRead);

module.exports = router;
