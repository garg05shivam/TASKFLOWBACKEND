const Project = require("../models/project.model");
const Task = require("../models/task.model");
const TaskComment = require("../models/taskComment.model");
const ProjectMessage = require("../models/projectMessage.model");
const Notification = require("../models/notification.model");
const AppError = require("../utils/appError");
const {
  assertProjectAccess,
  canAccessProject,
  notifyUsers,
  projectAudienceUserIds,
  recordActivity,
} = require("./collaboration.service");
const projectService = require("./project.service");

const getMembers = async (projectId, user) => {
  return await projectService.getProjectMembers(projectId, user);
};

const addMember = async (projectId, email, user) => {
  return await projectService.addMemberByEmail(projectId, email, user);
};

const acceptInvitation = async (token, user) => {
  return await projectService.acceptInvitationByToken(token, user);
};

const removeMember = async (projectId, memberId, user) => {
  return await projectService.removeMember(projectId, memberId, user);
};

const getActivity = async (projectId, user) => {
  return await projectService.getProjectActivity(projectId, user);
};

const addTaskComment = async (taskId, text, user) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!canAccessProject(task.project, user)) {
    throw new AppError("Access denied", 403);
  }

  const cleanText = String(text || "").trim();
  if (!cleanText) {
    throw new AppError("Comment text is required", 400);
  }

  const comment = await TaskComment.create({
    task: task._id,
    project: task.project._id,
    author: user._id,
    text: cleanText,
  });

  await recordActivity({
    projectId: task.project._id,
    actorId: user._id,
    action: "commented on task",
    entityType: "comment",
    entityId: comment._id,
    metadata: { taskId: String(task._id), preview: cleanText.slice(0, 80) },
  });

  const project = await Project.findById(task.project._id).populate("owner members", "name email role");
  if (project) {
    await notifyUsers({
      userIds: projectAudienceUserIds(project),
      projectId: project._id,
      type: "comment",
      message: `${user.name || "A teammate"} commented on task \"${task.title}\"`,
      metadata: { taskId: String(task._id), commentId: String(comment._id) },
    });
  }

  return await TaskComment.findById(comment._id).populate("author", "name email role");
};

const getTaskComments = async (taskId, user) => {
  const task = await Task.findById(taskId).populate("project");
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!canAccessProject(task.project, user)) {
    throw new AppError("Access denied", 403);
  }

  return await TaskComment.find({ task: task._id })
    .populate("author", "name email role")
    .sort({ createdAt: -1 });
};

const sendProjectMessage = async (projectId, text, user) => {
  const project = await assertProjectAccess(projectId, user);

  const cleanText = String(text || "").trim();
  if (!cleanText) {
    throw new AppError("Message text is required", 400);
  }

  const message = await ProjectMessage.create({
    project: project._id,
    sender: user._id,
    text: cleanText,
  });

  await recordActivity({
    projectId: project._id,
    actorId: user._id,
    action: "sent chat message",
    entityType: "message",
    entityId: message._id,
    metadata: { preview: cleanText.slice(0, 100) },
  });

  await notifyUsers({
    userIds: projectAudienceUserIds(project),
    projectId: project._id,
    type: "chat",
    message: `${user.name || "A teammate"} sent a chat message in \"${project.name}\"`,
    metadata: { projectId: String(project._id), messageId: String(message._id) },
  });

  return await ProjectMessage.findById(message._id).populate("sender", "name email role");
};

const getProjectMessages = async (projectId, user) => {
  const project = await assertProjectAccess(projectId, user);

  return await ProjectMessage.find({ project: project._id })
    .populate("sender", "name email role")
    .sort({ createdAt: -1 })
    .limit(200);
};

const getNotifications = async (userId) => {
  return await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(150);
};

const markNotificationRead = async (notificationId, userId) => {
  const updated = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!updated) {
    throw new AppError("Notification not found", 404);
  }

  return updated;
};

const clearAllNotifications = async (userId) => {
  const result = await Notification.deleteMany({ user: userId });
  return { deletedCount: result.deletedCount || 0 };
};

module.exports = {
  acceptInvitation,
  addMember,
  addTaskComment,
  getActivity,
  getMembers,
  getNotifications,
  getProjectMessages,
  getTaskComments,
  clearAllNotifications,
  markNotificationRead,
  removeMember,
  sendProjectMessage,
};
