const projectService = require("../services/project.service");

const create = async (req, res, next) => {
  try {
    const project = await projectService.createProject(
      req.body,
      req.user._id
    );

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(
      req.user,
      req.query
    );

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user
    );

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(
      req.params.id,
      req.user
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
