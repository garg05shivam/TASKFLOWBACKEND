const Project = require("../models/project.model");
const User = require("../models/user.model");
const crypto = require("crypto");
const AppError = require("../utils/appError");
const { sendProjectInviteEmail } = require("./email.service");
const {
  canAccessProject,
  getProjectOrThrow,
  isProjectManager,
  notifyUsers,
  projectAudienceUserIds,
  recordActivity,
} = require("./collaboration.service");

const createProject = async (data, userId, userRole) => {
  if (userRole !== "admin") {
    throw new AppError("Only admin can create project", 403);
  }

  const project = await Project.create({
    name: data.name,
    description: data.description,
    owner: userId,
    members: [userId],
  });

  await recordActivity({
    projectId: project._id,
    actorId: userId,
    action: "created project",
    entityType: "project",
    entityId: project._id,
    metadata: { name: project.name },
  });

  return project;
};

const getProjects = async (user, query) => {
  const { search } = query;

  let filter = {};

  if (user.role !== "admin") {
    filter = {
      $or: [{ owner: user._id }, { members: user._id }],
    };
  }

  if (search) {
    filter = {
      ...filter,
      name: { $regex: search, $options: "i" },
    };
  }

  return await Project.find(filter)
    .populate("owner", "name email")
    .populate("members", "name email role");
};

const getProjectById = async (id, user) => {
  const project = await Project.findById(id)
    .populate("owner", "name email")
    .populate("members", "name email role");

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!canAccessProject(project, user)) {
    throw new AppError("Access denied", 403);
  }

  return project;
};

const updateProject = async (id, data, user) => {
  const project = await getProjectOrThrow(id);

  if (!isProjectManager(project, user)) {
    throw new AppError("Access denied", 403);
  }

  project.name = data.name || project.name;
  project.description = data.description || project.description;

  await project.save();

  await recordActivity({
    projectId: project._id,
    actorId: user._id,
    action: "updated project",
    entityType: "project",
    entityId: project._id,
    metadata: { name: project.name },
  });

  return project;
};

const deleteProject = async (id, user) => {
  const project = await getProjectOrThrow(id);

  if (!isProjectManager(project, user)) {
    throw new AppError("Access denied", 403);
  }

  await project.deleteOne();

  return { message: "Project deleted successfully" };
};

const addMemberByEmail = async (projectId, email, user) => {
  const project = await getProjectOrThrow(projectId);

  if (!isProjectManager(project, user)) {
    throw new AppError("Only project admin can invite members", 403);
  }

  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) {
    throw new AppError("Member email is required", 400);
  }

  const currentMemberIds = new Set((project.members || []).map((id) => String(id)));
  const existingUser = await User.findOne({ email: normalized });
  if (existingUser && currentMemberIds.has(String(existingUser._id))) {
    throw new AppError("User is already a project member", 400);
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  project.invitations = (project.invitations || []).filter((invite) => invite.email !== normalized);
  project.invitations.push({
    email: normalized,
    invitedBy: user._id,
    token,
    expiresAt,
    status: "pending",
  });
  await project.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const acceptUrl = `${clientUrl}/invite/accept?token=${token}`;

  await sendProjectInviteEmail({
    email: normalized,
    inviterName: user.name,
    projectName: project.name,
    acceptUrl,
  });

  await recordActivity({
    projectId: project._id,
    actorId: user._id,
    action: "invited member",
    entityType: "member",
    entityId: normalized,
    metadata: { email: normalized },
  });

  return { project, status: "invited", message: "Invitation email sent" };
};

const getProjectMembers = async (projectId, user) => {
  const project = await getProjectById(projectId, user);
  const safeInvitations = (project.invitations || []).map((item) => ({
    email: item.email,
    status: item.status,
    expiresAt: item.expiresAt,
    acceptedAt: item.acceptedAt || null,
  }));

  return {
    owner: project.owner,
    members: project.members,
    invitations: safeInvitations,
  };
};

const removeMember = async (projectId, memberId, user) => {
  const project = await getProjectOrThrow(projectId);

  if (!isProjectManager(project, user)) {
    throw new AppError("Only project admin can remove members", 403);
  }

  if (String(project.owner) === String(memberId)) {
    throw new AppError("Owner cannot be removed from project", 400);
  }

  project.members = (project.members || []).filter((id) => String(id) !== String(memberId));
  await project.save();

  await recordActivity({
    projectId: project._id,
    actorId: user._id,
    action: "removed member",
    entityType: "member",
    entityId: memberId,
  });

  return { message: "Member removed" };
};

const acceptInvitationByToken = async (token, user) => {
  const cleanToken = String(token || "").trim();
  if (!cleanToken) {
    throw new AppError("Invitation token is required", 400);
  }

  const project = await Project.findOne({ "invitations.token": cleanToken });
  if (!project) {
    throw new AppError("Invitation not found", 404);
  }

  const invitation = (project.invitations || []).find((item) => item.token === cleanToken);
  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  if (invitation.status !== "pending") {
    throw new AppError("Invitation already used", 400);
  }

  if (new Date(invitation.expiresAt).getTime() < Date.now()) {
    throw new AppError("Invitation expired", 400);
  }

  if (String(invitation.email).toLowerCase() !== String(user.email).toLowerCase()) {
    throw new AppError("This invitation is for a different email account", 403);
  }

  const memberIds = new Set((project.members || []).map((id) => String(id)));
  if (!memberIds.has(String(user._id))) {
    project.members.push(user._id);
  }

  invitation.status = "accepted";
  invitation.acceptedBy = user._id;
  invitation.acceptedAt = new Date();

  await project.save();

  await recordActivity({
    projectId: project._id,
    actorId: user._id,
    action: "accepted invitation",
    entityType: "member",
    entityId: user._id,
    metadata: { email: user.email },
  });

  await notifyUsers({
    userIds: [project.owner],
    projectId: project._id,
    type: "member_invite",
    message: `${user.name || user.email} accepted invite to "${project.name}"`,
    metadata: { projectId: String(project._id) },
  });

  return { projectId: project._id, message: "Invitation accepted" };
};

const getProjectActivity = async (projectId, user) => {
  const project = await getProjectOrThrow(projectId);
  if (!canAccessProject(project, user)) {
    throw new AppError("Access denied", 403);
  }

  const Activity = require("../models/activity.model");
  const items = await Activity.find({ project: projectId })
    .populate("actor", "name email")
    .sort({ createdAt: -1 })
    .limit(100);

  return items;
};

const notifyProjectAudience = async (project, payload) => {
  await notifyUsers({
    userIds: projectAudienceUserIds(project),
    ...payload,
  });
};

module.exports = {
  acceptInvitationByToken,
  addMemberByEmail,
  createProject,
  deleteProject,
  getProjectActivity,
  getProjectById,
  getProjectMembers,
  getProjects,
  notifyProjectAudience,
  removeMember,
  updateProject,
};
