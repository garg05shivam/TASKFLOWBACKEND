const User = require("../models/user.model");
const Project = require("../models/project.model");
const Task = require("../models/task.model");
const Notification = require("../models/notification.model");
const TaskComment = require("../models/taskComment.model");
const ProjectMessage = require("../models/projectMessage.model");
const Otp = require("../models/otp.model");
const AppError = require("../utils/appError");
const Activity = require("../models/activity.model");

const getSystemOverview = async () => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const [
    totalUsers,
    totalAdmins,
    totalProjects,
    totalTasks,
    overdueTasks,
    completedThisWeek,
    tasksByStatus,
    tasksByPriority,
    trendRows,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "admin" }),
    Project.countDocuments({}),
    Task.countDocuments({}),
    Task.countDocuments({
      status: { $ne: "done" },
      dueDate: { $ne: null, $lt: now },
    }),
    Task.countDocuments({
      status: "done",
      updatedAt: { $gte: weekStart, $lte: now },
    }),
    Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]),
    Activity.aggregate([
      {
        $match: {
          action: "completed task",
          createdAt: { $gte: weekStart, $lte: now },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
    User.find({})
      .select("name email role createdAt isVerified isActive")
      .sort({ createdAt: -1 })
      .limit(8),
  ]);

  const statusMap = {
    todo: 0,
    "in-progress": 0,
    done: 0,
  };

  tasksByStatus.forEach((row) => {
    if (statusMap[row._id] !== undefined) {
      statusMap[row._id] = row.count;
    }
  });

  const priorityMap = {
    low: 0,
    medium: 0,
    high: 0,
  };
  tasksByPriority.forEach((row) => {
    if (priorityMap[row._id] !== undefined) {
      priorityMap[row._id] = row.count;
    }
  });

  const trendMap = {};
  trendRows.forEach((row) => {
    trendMap[row._id] = row.count;
  });
  const completedTrend7d = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    completedTrend7d.push({
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      value: trendMap[key] || 0,
    });
  }

  return {
    totalUsers,
    totalAdmins,
    totalProjects,
    totalTasks,
    overdueTasks,
    completedThisWeek,
    tasksByStatus: statusMap,
    tasksByPriority: priorityMap,
    completedTrend7d,
    recentUsers,
  };
};

const updateUserRole = async ({ targetUserId, actorUserId, role }) => {
  const nextRole = String(role || "").trim();
  if (!["user", "admin"].includes(nextRole)) {
    throw new AppError("Role must be user or admin", 400);
  }

  const target = await User.findById(targetUserId);
  if (!target) {
    throw new AppError("User not found", 404);
  }

  if (String(target._id) === String(actorUserId)) {
    throw new AppError("Super admin cannot change own role", 400);
  }

  if (target.role === "super_admin") {
    throw new AppError("Cannot change super admin role", 403);
  }

  target.role = nextRole;
  await target.save();

  return {
    userId: String(target._id),
    role: target.role,
  };
};

const updateUserActiveStatus = async ({ targetUserId, actorUserId, isActive }) => {
  const target = await User.findById(targetUserId);
  if (!target) {
    throw new AppError("User not found", 404);
  }

  if (String(target._id) === String(actorUserId)) {
    throw new AppError("Super admin cannot deactivate own account", 400);
  }

  if (target.role === "super_admin") {
    throw new AppError("Cannot change super admin status", 403);
  }

  const nextStatus = Boolean(isActive);
  if (!nextStatus) {
    const ownedProjects = await Project.countDocuments({ owner: target._id });
    if (ownedProjects > 0) {
      throw new AppError("Cannot deactivate this admin. Reassign or delete owned projects first.", 400);
    }
  }

  target.isActive = nextStatus;
  await target.save();

  return {
    userId: String(target._id),
    isActive: target.isActive,
  };
};

const removeUserById = async ({ targetUserId, actorUserId }) => {
  if (!targetUserId) {
    throw new AppError("User id is required", 400);
  }

  const target = await User.findById(targetUserId);
  if (!target) {
    throw new AppError("User not found", 404);
  }

  if (String(target._id) === String(actorUserId)) {
    throw new AppError("Super admin cannot remove own account", 400);
  }

  if (target.role === "super_admin") {
    throw new AppError("Cannot remove super admin account", 403);
  }

  const ownedProjects = await Project.countDocuments({ owner: target._id });
  if (ownedProjects > 0) {
    throw new AppError("Cannot remove this admin. Reassign or delete owned projects first.", 400);
  }

  await Promise.all([
    Project.updateMany(
      {},
      {
        $pull: {
          members: target._id,
          invitations: { email: String(target.email || "").toLowerCase() },
        },
      }
    ),
    Task.updateMany({ assignedTo: target._id }, { $set: { assignedTo: null } }),
    Notification.deleteMany({ user: target._id }),
    TaskComment.deleteMany({ author: target._id }),
    ProjectMessage.deleteMany({ sender: target._id }),
    Otp.deleteMany({ user: target._id }),
    User.deleteOne({ _id: target._id }),
  ]);

  return {
    removedUserId: String(target._id),
    removedEmail: target.email,
    removedRole: target.role,
  };
};

module.exports = {
  getSystemOverview,
  updateUserRole,
  updateUserActiveStatus,
  removeUserById,
};
