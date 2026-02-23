const Activity = require("../models/activity.model");
const Notification = require("../models/notification.model");
const Project = require("../models/project.model");
const AppError = require("../utils/appError");

const getProjectOrThrow = async (projectId) => {
  const project = await Project.findById(projectId).populate("owner", "name email");
  if (!project) {
    throw new AppError("Project not found", 404);
  }
  return project;
};

const canAccessProject = (project, user) => {
  if (!project || !user) return false;
    if (String(project.owner?._id || project.owner) === String(user._id)) return true;

  const memberIds = Array.isArray(project.members) ? project.members.map((id) => String(id)) : [];
  return memberIds.includes(String(user._id));
};

const assertProjectAccess = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  if (!canAccessProject(project, user)) {
    throw new AppError("Access denied", 403);
  }
  return project;
};

const isProjectManager = (project, user) => {
  return user.role === "admin" && String(project.owner?._id || project.owner) === String(user._id);
};

const recordActivity = async ({ projectId, actorId, action, entityType, entityId = "", metadata = {} }) => {
  await Activity.create({
    project: projectId,
    actor: actorId,
    action,
    entityType,
    entityId: String(entityId || ""),
    metadata,
  });
};

const notifyUsers = async ({ userIds, projectId, type, message, metadata = {} }) => {
  const unique = [...new Set((userIds || []).map((id) => String(id)).filter(Boolean))];
  if (!unique.length) return;

  const docs = unique.map((userId) => ({
    user: userId,
    project: projectId || null,
    type,
    message,
    metadata,
  }));

  await Notification.insertMany(docs);
};

const projectAudienceUserIds = (project) => {
  const ids = [];
  if (project.owner) ids.push(String(project.owner._id || project.owner));
  if (Array.isArray(project.members)) {
    project.members.forEach((id) => ids.push(String(id)));
  }
  return [...new Set(ids)];
};

module.exports = {
  assertProjectAccess,
  canAccessProject,
  getProjectOrThrow,
  isProjectManager,
  notifyUsers,
  projectAudienceUserIds,
  recordActivity,
};



