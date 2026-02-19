const projectService = require("../services/project.service");

const create = async (req, res) => {
  try {
    const project = await projectService.createProject(
      req.body,
      req.user._id
    );

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const projects = await projectService.getProjects(req.user);

    res.json({ success: true, projects });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user
    );

    res.json({ success: true, project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.body,
      req.user
    );

    res.json({ success: true, project });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await projectService.deleteProject(
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
  getOne,
  update,
  remove,
};
