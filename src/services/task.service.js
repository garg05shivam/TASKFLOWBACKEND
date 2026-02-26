const Task = require("../models/task.model");
const Project = require("../models/project.model");
const Activity = require("../models/activity.model");
const AppError = require("../utils/appError");
const {
  canAccessProject,
  isProjectManager,
  notifyUsers,
  projectAudienceUserIds,
  recordActivity,
} = require("./collaboration.service");

const buildLast7DayBuckets = () => {
  const now = new Date();
  const buckets = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    buckets.push({ key: iso, label: d.toLocaleDateString(undefined, { weekday: "short" }), value: 0 });
  }
  return buckets;
};

const toCountMap = (rows) => {
  const map = {};
  (rows || []).forEach((row) => {
    map[row._id] = row.count;
  });
  return map;
};

const getAccessibleProjectIdsForAnalytics = async (user) => {
  if (user.role === "super_admin") {
    return await Project.distinct("_id", {});
  }

  if (user.role === "user") {
    return await Task.distinct("project", { assignedTo: user._id });
  }

  return await Project.distinct("_id", {
    $or: [
      { owner: user._id },
      { members: user._id },
      { invitations: { $elemMatch: { email: String(user.email || "").toLowerCase(), status: "accepted" } } },
    ],
  });
};

const normalizeAssignee = (project, assignedTo) => {
  if (assignedTo === undefined) {
    return { hasValue: false, value: undefined };
  }

  if (!assignedTo) {
    return { hasValue: true, value: null };
  }

  const assigneeId = String(assignedTo);
  const ownerId = String(project.owner?._id || project.owner);
  const memberIds = new Set((project.members || []).map((member) => String(member._id || member)));

  if (assigneeId !== ownerId && !memberIds.has(assigneeId)) {
    throw new AppError("Assignee must be project owner or member", 400);
  }

  return { hasValue: true, value: assigneeId };
};

const getTaskById = async (id, user) => {
  const task = await Task.findById(id)
    .populate("assignedTo", "name email role")
    .populate({
      path: "project",
      populate: [
        { path: "owner", select: "name email" },
        { path: "members", select: "name email role" },
      ],
    });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!canAccessProject(task.project, user)) {
    throw new AppError("Access denied", 403);
  }

  return task;
};

const createTask = async (data, user) => {
  const project = await Project.findById(data.project).populate("owner members", "name email role");

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!isProjectManager(project, user)) {
    throw new AppError("Only project admin can create tasks", 403);
  }

  const assignee = normalizeAssignee(project, data.assignedTo);
  const normalizedLabels = Array.isArray(data.labels)
    ? [...new Set(data.labels.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

  const task = await Task.create({
    title: data.title,
    description: data.description,
    project: data.project,
    priority: data.priority || "medium",
    labels: normalizedLabels,
    dueDate: data.dueDate || null,
    assignedTo: assignee.hasValue ? assignee.value : null,
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  });

  await recordActivity({
    projectId: project._id,
    actorId: user._id,
    action: "created task",
    entityType: "task",
    entityId: task._id,
    metadata: { title: task.title },
  });

  await notifyUsers({
    userIds: projectAudienceUserIds(project),
    projectId: project._id,
    type: "activity",
    message: `${user.name || "A teammate"} created task "${task.title}"`,
    metadata: { taskId: String(task._id) },
  });

  if (assignee.hasValue && assignee.value) {
    await notifyUsers({
      userIds: [assignee.value],
      projectId: project._id,
      type: "task_assign",
      message: `You were assigned task "${task.title}"`,
      metadata: { taskId: String(task._id) },
    });
  }

  return await Task.findById(task._id).populate("assignedTo", "name email role");
};

const getTasks = async (query, user) => {
  const { project, assignedTo, status, priority, label, page = 1, limit = 5, search } = query;

  const projectData = await Project.findById(project).populate("owner members", "name email role");

  if (!projectData) {
    throw new AppError("Project not found", 404);
  }

  if (!canAccessProject(projectData, user)) {
    throw new AppError("Access denied", 403);
  }

  const filter = { project };
  const requestedAssignee = assignedTo ? String(assignedTo) : null;
  const currentUserId = String(user._id);

  if (status) {
    filter.status = status;
  }
  if (priority) {
    filter.priority = priority;
  }
  if (label) {
    filter.labels = { $in: [String(label).trim()] };
  }

  if (user.role === "user") {
    // Members should only receive their own assigned tasks.
    filter.assignedTo = currentUserId;
  } else if (requestedAssignee) {
    filter.assignedTo = requestedAssignee;
  }

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email role")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const total = await Task.countDocuments(filter);

  return {
    tasks,
    total,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber),
  };
};

const updateTask = async (id, data, user) => {
  const task = await Task.findById(id).populate({
    path: "project",
    populate: [
      { path: "owner", select: "name email" },
      { path: "members", select: "name email role" },
    ],
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!isProjectManager(task.project, user)) {
    throw new AppError("Only project admin can update tasks", 403);
  }

  const previousDue = task.dueDate ? new Date(task.dueDate).getTime() : null;

  const previousAssignee = String(task.assignedTo || "");

  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.status !== undefined) task.status = data.status;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.labels !== undefined) {
    task.labels = Array.isArray(data.labels)
      ? [...new Set(data.labels.map((item) => String(item || "").trim()).filter(Boolean))]
      : [];
  }
  if (data.dueDate !== undefined) task.dueDate = data.dueDate || null;
  if (Array.isArray(data.attachments)) task.attachments = data.attachments;

  const assignee = normalizeAssignee(task.project, data.assignedTo);
  if (assignee.hasValue) {
    task.assignedTo = assignee.value;
  }

  const assigneeChanged = assignee.hasValue && String(task.assignedTo || "") !== previousAssignee;
  if (data.dueDate !== undefined || assigneeChanged) {
    task.dueReminderSentAt = null;
    task.overdueReminderSentAt = null;
  }

  await task.save();

  await recordActivity({
    projectId: task.project._id,
    actorId: user._id,
    action: "updated task",
    entityType: "task",
    entityId: task._id,
    metadata: { title: task.title, status: task.status },
  });

  await notifyUsers({
    userIds: projectAudienceUserIds(task.project),
    projectId: task.project._id,
    type: "activity",
    message: `${user.name || "A teammate"} updated task "${task.title}"`,
    metadata: { taskId: String(task._id), status: task.status },
  });

  if (assignee.hasValue && assignee.value) {
    await notifyUsers({
      userIds: [assignee.value],
      projectId: task.project._id,
      type: "task_assign",
      message: `You were assigned task "${task.title}"`,
      metadata: { taskId: String(task._id) },
    });
  }

  if (task.dueDate) {
    const dueAt = new Date(task.dueDate).getTime();
    const soon = dueAt - Date.now() <= 48 * 60 * 60 * 1000;
    const changed = previousDue !== dueAt;
    if (soon && changed) {
      await notifyUsers({
        userIds: projectAudienceUserIds(task.project),
        projectId: task.project._id,
        type: "task_due",
        message: `Task "${task.title}" is due soon`,
        metadata: { taskId: String(task._id), dueDate: task.dueDate },
      });
    }
  }

  return await Task.findById(task._id)
    .populate("assignedTo", "name email role")
    .populate({
      path: "project",
      populate: [
        { path: "owner", select: "name email" },
        { path: "members", select: "name email role" },
      ],
    });
};

const deleteTask = async (id, user) => {
  const task = await Task.findById(id).populate("project");

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!isProjectManager(task.project, user)) {
    throw new AppError("Only project admin can delete tasks", 403);
  }

  await task.deleteOne();

  await recordActivity({
    projectId: task.project._id,
    actorId: user._id,
    action: "deleted task",
    entityType: "task",
    entityId: id,
    metadata: { title: task.title },
  });

  return { message: "Task deleted successfully" };
};

const completeTaskByAssignee = async (id, user) => {
  const task = await Task.findById(id).populate({
    path: "project",
    populate: [
      { path: "owner", select: "name email role" },
      { path: "members", select: "name email role" },
    ],
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!canAccessProject(task.project, user)) {
    throw new AppError("Access denied", 403);
  }

  const assignedUserId = String(task.assignedTo || "");
  if (!assignedUserId || assignedUserId !== String(user._id)) {
    throw new AppError("Only assigned user can mark this task done", 403);
  }

  const taskTitle = task.title;
  const projectId = task.project._id;
  const ownerId = task.project.owner?._id || task.project.owner;

  await recordActivity({
    projectId,
    actorId: user._id,
    action: "completed task",
    entityType: "task",
    entityId: task._id,
    metadata: { title: taskTitle },
  });

  await notifyUsers({
    userIds: [ownerId],
    projectId,
    type: "activity",
    message: `${user.name || user.email} completed task "${taskTitle}". Task was removed.`,
    metadata: { taskId: String(task._id), completedBy: String(user._id) },
  });

  await task.deleteOne();

  return { message: "Task marked done and removed" };
};

const getDashboardAnalytics = async (user) => {
  if (user.role === "user") {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const completedThisWeek = await Activity.countDocuments({
      action: "completed task",
      actor: user._id,
      createdAt: { $gte: weekStart, $lte: now },
    });

    const overdueCount = await Task.countDocuments({
      assignedTo: user._id,
      status: { $ne: "done" },
      dueDate: { $ne: null, $lt: now },
    });

    const openTasks = await Task.countDocuments({
      assignedTo: user._id,
      status: { $ne: "done" },
    });

    const [statusRows, priorityRows, trendRows] = await Promise.all([
      Task.aggregate([
        { $match: { assignedTo: user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { assignedTo: user._id } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Activity.aggregate([
        {
          $match: {
            actor: user._id,
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
    ]);

    const statusMap = toCountMap(statusRows);
    const priorityMap = toCountMap(priorityRows);
    const trendMap = toCountMap(trendRows);
    const completedTrend7d = buildLast7DayBuckets().map((item) => ({
      label: item.label,
      value: trendMap[item.key] || 0,
    }));

    return {
      completedThisWeek,
      overdueCount,
      assigneeWorkload: openTasks
        ? [
            {
              assigneeId: user._id,
              name: user.name,
              email: user.email,
              openTasks,
            },
          ]
        : [],
      tasksByStatus: {
        todo: statusMap.todo || 0,
        "in-progress": statusMap["in-progress"] || 0,
        done: statusMap.done || 0,
      },
      tasksByPriority: {
        low: priorityMap.low || 0,
        medium: priorityMap.medium || 0,
        high: priorityMap.high || 0,
      },
      completedTrend7d,
    };
  }

  const projectIds = await getAccessibleProjectIdsForAnalytics(user);
  if (!projectIds.length) {
    return {
      completedThisWeek: 0,
      overdueCount: 0,
      assigneeWorkload: [],
    };
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const [completedThisWeek, overdueCount, workloadRows, statusRows, priorityRows, trendRows] =
    await Promise.all([
      Activity.countDocuments({
        project: { $in: projectIds },
        action: "completed task",
        createdAt: { $gte: weekStart, $lte: now },
      }),
      Task.countDocuments({
        project: { $in: projectIds },
        status: { $ne: "done" },
        dueDate: { $ne: null, $lt: now },
      }),
      Task.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            status: { $ne: "done" },
            assignedTo: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$assignedTo",
            openTasks: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "assignee",
          },
        },
        { $unwind: "$assignee" },
        { $sort: { openTasks: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            assigneeId: "$_id",
            name: "$assignee.name",
            email: "$assignee.email",
            openTasks: 1,
          },
        },
      ]),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Activity.aggregate([
        {
          $match: {
            project: { $in: projectIds },
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
    ]);

  const statusMap = toCountMap(statusRows);
  const priorityMap = toCountMap(priorityRows);
  const trendMap = toCountMap(trendRows);
  const completedTrend7d = buildLast7DayBuckets().map((item) => ({
    label: item.label,
    value: trendMap[item.key] || 0,
  }));

  return {
    completedThisWeek,
    overdueCount,
    assigneeWorkload: workloadRows,
    tasksByStatus: {
      todo: statusMap.todo || 0,
      "in-progress": statusMap["in-progress"] || 0,
      done: statusMap.done || 0,
    },
    tasksByPriority: {
      low: priorityMap.low || 0,
      medium: priorityMap.medium || 0,
      high: priorityMap.high || 0,
    },
    completedTrend7d,
  };
};

module.exports = {
  completeTaskByAssignee,
  createTask,
  getDashboardAnalytics,
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
};
