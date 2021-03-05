/* DEPENDENCIES */
const jwt = require("jsonwebtoken");
/* OWN MODULES */
const AppError = require("./AppError");

/* SIGN JWT */
const signToken = (user) => {
  try {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIREIN,
    });

    return token;
  } catch (err) {
    throw new AppError(err, 400);
  }
};

/* VERIFY JWT */
const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

/* EXPORTS */
module.exports = { signToken, verifyToken };
