const collaborationService = require("../services/collaborationFeature.service");

const getProjectMembers = async (req, res, next) => {
  try {
    const result = await collaborationService.getMembers(req.params.projectId, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const addProjectMember = async (req, res, next) => {
  try {
    const result = await collaborationService.addMember(req.params.projectId, req.body.email, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  try {
    const result = await collaborationService.acceptInvitation(req.body.token, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const removeProjectMember = async (req, res, next) => {
  try {
    const result = await collaborationService.removeMember(req.params.projectId, req.params.memberId, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getProjectActivity = async (req, res, next) => {
  try {
    const items = await collaborationService.getActivity(req.params.projectId, req.user);
    res.status(200).json({ success: true, items });
  } catch (error) {
    next(error);
  }
};

const listTaskComments = async (req, res, next) => {
  try {
    const comments = await collaborationService.getTaskComments(req.params.taskId, req.user);
    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

const createTaskComment = async (req, res, next) => {
  try {
    const comment = await collaborationService.addTaskComment(req.params.taskId, req.body.text, req.user);
    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

const listProjectMessages = async (req, res, next) => {
  try {
    const messages = await collaborationService.getProjectMessages(req.params.projectId, req.user);
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

const sendProjectMessage = async (req, res, next) => {
  try {
    const message = await collaborationService.sendProjectMessage(req.params.projectId, req.body.text, req.user);
    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await collaborationService.getNotifications(req.user._id);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await collaborationService.markNotificationRead(req.params.id, req.user._id);
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
