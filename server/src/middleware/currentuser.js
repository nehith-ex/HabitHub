export function currentUser(req, res, next) {
  const headerId = Number(req.headers['x-user-id']);
  req.userId = Number.isInteger(headerId) && headerId > 0 ? headerId : 1;
  next();
}
