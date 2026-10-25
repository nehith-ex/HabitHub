import * as service from '../services/checkIns.service.js';

export const list = async (req, res) => {
  res.json({ data: await service.list(req.userId, req.query) });
};

export const upsert = async (req, res) => {
  const checkIn = await service.upsert(req.userId, Number(req.params.id), req.body);
  res.json({ data: checkIn });
};

export const remove = async (req, res) => {
  const deleted = await service.remove(req.userId, Number(req.params.id), req.params.date);
  if (!deleted) return res.status(204).send();
  res.status(204).send();
};
