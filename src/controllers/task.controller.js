const taskService = require("../services/task.service");

const create = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.user);
    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const result = await taskService.getTasks(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await taskService.deleteTask(
      req.params.id,
      req.user
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  create,
  getAll,
  update,
  remove,
};
