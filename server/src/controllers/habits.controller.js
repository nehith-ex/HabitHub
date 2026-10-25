import * as service from '../services/habits.service.js';

export const create = async (req, res) => {
  res.status(201).json({ data: await service.create(req.userId, req.body) });
};

export const list = async (req, res) => {
  const { items, meta } = await service.list(req.userId, req.query);
  res.json({ data: items, meta });
};

export const getOne = async (req, res) => {
  res.json({ data: await service.getOne(req.userId, Number(req.params.id)) });
};

export const update = async (req, res) => {
  res.json({ data: await service.update(req.userId, Number(req.params.id), req.body) });
};

export const remove = async (req, res) => {
  await service.remove(req.userId, Number(req.params.id));
  res.status(204).send();
};
