/* eslint-disable no-console */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const AuthorizationError = require('../errors/AuthorizationError');
const ConflictError = require('../errors/ConflictError');
const { notAuthorized, userNotFound, conflict } = require('../utils/constants');
const { privateKey } = require('../utils/configuration');

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.createUser = (req, res, next) => {
  const { name, email, password } = req.body;

  User.findOne({ email })
    .then((userExists) => {
      if (userExists) {
        throw new ConflictError(conflict);
      }

      bcrypt
        .hash(password, 10)
        .then((hash) =>
          User.create({
            name,
            email,
            password: hash,
          })
        )
        .then((user) =>
          res.send({
            _id: user._id,
            email: user.email,
          })
        );
    })
    .catch(next);
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      if (!user) {
        throw new AuthorizationError(notAuthorized);
      }
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : privateKey,
        { expiresIn: '7d' }
      );
      res.send({ token });
    })
    .catch(next);
};

module.exports.getCurrentUser = (req, res, next) => {
  User.findById(req.user._id).then((user) => {
    if (!user) {
      throw new NotFoundError(userNotFound);
    } else {
      return res.status(200).send({ user });
    }
  });
};
