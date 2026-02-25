const Task = require("../models/task.model");
const Notification = require("../models/notification.model");
const { sendTaskDueReminderEmail } = require("./email.service");

const TEN_MINUTES = 10 * 60 * 1000;
let intervalRef = null;
let isRunning = false;

const buildReminderMessage = ({ task, isOverdue }) => {
  const dueText = task?.dueDate ? new Date(task.dueDate).toLocaleString() : "soon";
  if (isOverdue) {
    return `Task "${task.title}" is overdue (due: ${dueText}).`;
  }
  return `Task "${task.title}" is due by ${dueText}.`;
};

const notifyAssignee = async (task, isOverdue) => {
  if (!task?.assignedTo?._id || !task?.assignedTo?.email) return;

  const message = buildReminderMessage({ task, isOverdue });

  await Notification.create({
    user: task.assignedTo._id,
    project: task.project?._id || task.project || null,
    type: "task_due",
    message,
    metadata: {
      taskId: String(task._id),
      dueDate: task.dueDate,
      reminderType: isOverdue ? "overdue" : "due_24h",
    },
  });

  try {
    await sendTaskDueReminderEmail({
      email: task.assignedTo.email,
      assigneeName: task.assignedTo.name,
      taskTitle: task.title,
      projectName: task.project?.name || "Project",
      dueDate: task.dueDate,
      isOverdue,
    });
  } catch (error) {
    // Keep in-app reminders working even if SMTP fails.
    console.error("TASK REMINDER EMAIL ERROR:", error.message);
  }

  if (isOverdue) {
    task.overdueReminderSentAt = new Date();
  } else {
    task.dueReminderSentAt = new Date();
  }
  await task.save();
};

const runTaskDueReminderJob = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dueSoonTasks = await Task.find({
      status: { $ne: "done" },
      dueDate: { $gte: now, $lte: in24Hours },
      assignedTo: { $ne: null },
      dueReminderSentAt: null,
    })
      .populate("assignedTo", "name email")
      .populate("project", "name");

    for (const task of dueSoonTasks) {
      await notifyAssignee(task, false);
    }

    const overdueTasks = await Task.find({
      status: { $ne: "done" },
      dueDate: { $lt: now },
      assignedTo: { $ne: null },
      overdueReminderSentAt: null,
    })
      .populate("assignedTo", "name email")
      .populate("project", "name");

    for (const task of overdueTasks) {
      await notifyAssignee(task, true);
    }
  } catch (error) {
    console.error("TASK REMINDER JOB ERROR:", error.message);
  } finally {
    isRunning = false;
  }
};

const startTaskReminderWorker = () => {
  if (intervalRef) return intervalRef;
  runTaskDueReminderJob();
  intervalRef = setInterval(runTaskDueReminderJob, TEN_MINUTES);
  return intervalRef;
};

module.exports = {
  runTaskDueReminderJob,
  startTaskReminderWorker,
};
