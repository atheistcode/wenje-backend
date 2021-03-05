const handleDuplicateFieldsMsg = (err) => {
  const fieldnames = Object.getOwnPropertyNames(err.keyValue)
    .map((el) => el.charAt(0).toUpperCase() + el.slice(1))
    .join();

  if (fieldnames) {
    return `${fieldnames} already exists.`;
  } else {
    return "Unique field already exists";
  }
};

const handleJwtErrorMsg = (err) => {
  return "Invalid token. Please sign out and sign in again.";
};

const handleJwtExpiredMsg = (err) => {
  return "Token has expired. Please sign in again.";
};

const handleErrorMsgs = (err) => {
  if (err.code && err.code === 11000) err.message = handleDuplicateFieldsMsg(err);

  if (err.name && err.name === "JsonWebTokenError") err.message = handleJwtErrorMsg(err);

  if (err.name && err.name === "TokenExpiredError") err.message = handleJwtExpiredMsg(err);

  if (!err.isOperational) err.message = "Something went wrong. Please try again later.";
};

module.exports = (err, req, res, next) => {
  handleErrorMsgs(err);

  // console.log("ERROR ❌🌹", err);

  /* IN PRODUCTION */
  if (process.env.NODE_ENV === "production") res.status(err.statusCode).json({ message: err.message });

  /* IN DEVELOPMENT */
  if (process.env.NODE_ENV !== "production") {
    console.log(err);
    res.status(err.statusCode || 500).json({
      ...err,
      // stack: err.stack,
    });
  }
};
