/* CORE MODULES */
const crypto = require("crypto");
/* OWN MODULES */
const userController = require("./user.controller");
const jwt = require("../utils/jwt");
const AppError = require("../utils/AppError");
// const sendEmail = require("../utils/SendEmail");

/* CONTROLLERS */
const signup = async (req, res, next) => {
  try {
    /* (1) store client input */
    let name, email, password;
    req.body.name && (name = req.body.name);
    req.body.email && (email = req.body.email);
    req.body.password && (password = req.body.password);

    /* (2) check if client input is complete */
    if (!name || !email || !password)
      return next(new AppError({ message: "Please provide registration name, email, and password." }, 400));

    /* (3) create a user */
    const user = await userController.create({
      name: name,
      email: email,
      password: password,
    });

    /* (4) remove password data from output */
    user.passwordData = undefined;

    /* (5) sign token */
    const token = jwt.signToken(user);

    /* (6) send response */
    res.status(201).json({
      results: 1,
      status: "Success",
      statusCode: 201,
      message: "Signed up a user.",
      data: {
        user: {
          userData: user,
          token: token,
        },
      },
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};

const signin = async (req, res, next) => {
  try {
    /* (1) store client input */
    const { email, password } = req.body;

    /* (2) check if client input is complete */
    if (!email || !password)
      return next(new AppError({ message: "Please provide login email address and password." }, 400));

    /* (3) find user */
    const user = await userController.getOne({ email: email });

    /* (4) validate client password */
    const isPasswordValid = await user.comparePassword(password, user.passwordData.hashedPassword);

    if (!isPasswordValid) return next(new AppError({ message: "Invalid login email address or password." }, 401));

    /* (5) remove password data from output */
    user.passwordData = undefined;

    /* (6) sign token */
    const token = jwt.signToken(user);

    /* (7) send response */
    res.status(200).json({
      results: 1,
      status: "Success",
      statusCode: 200,
      message: "Signed in a user.",
      data: {
        user: {
          userData: user,
          token: token,
        },
      },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const protectRoute = async (req, res, next) => {
  try {
    /* (1) check if auth token is sent with headers */
    if (!req.headers.authorization || !req.headers.authorization.split(" ")[0] === "Bearer")
      return next(new AppError({ message: "Please sign in to access this route." }, 401));

    /* (2) store token */
    const token = req.headers.authorization.split(" ")[1];

    /* (3) check if token exists */
    if (!token) return next(new AppError({ message: "Please sign in to access this route." }, 401));

    /* (4) verify token */
    let decoded;
    decoded = jwt.verifyToken(token);

    /* (5) find user */
    const user = await userController.getOne({ _id: decoded.id });

    /* (6) check if user didn't change password recently */
    if (user.passwordUpdatedAfter(decoded.iat))
      return next(
        new AppError({ message: "Password has been changed recently, please sign out and sign in again." }, 401)
      );

    /* (7) save auth user data on request */
    req.authUser = user;

    /* (8) grant access to protected route */
    next();
  } catch (err) {
    return next(new AppError(err, 401));
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    /* (1) store client input */
    const { email } = req.body;

    /* (2) check if client input is complete */
    if (!email) return next(new AppError({ message: "Please provide login email address." }, 400));

    /* (3) find user */
    const user = await userController.getOne({ email: email });

    /* (4) create a reset token and save hashedResetToken resetTokenExpire to database */
    const resetToken = user.createResetToken();

    await user.save();

    /* (5) create a reset url to send it to user by email */
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/resetpassword/${resetToken}`;

    /* (6) send notification email */
    // const messageText = `Forgot your password? Submit a PATCH request with your new password to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;

    // await sendEmail({
    //   to: user.email,
    //   subject: "Your Password Reset URL (Valid For 10 Minutes).",
    //   text: messageText,
    // });

    /* (7) send response */
    res.status(200).json({
      results: 0,
      status: "Success",
      statusCode: 200,
      message: "Password reset URL has been sent to email.",
    });
  } catch (err) {
    /* (8) if there is an error, remove hashedResetToken and resetTokenExpire from database */
    user.passwordData.hashedResetToken = undefined;
    user.passwordData.resetTokenExpire = undefined;

    await user.save();

    return next(new AppError(err, 500));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    /* (1) store client input */
    const resetToken = req.params.resetToken;
    const password = req.body.password;

    /* (2) hash the reset token received from user  */
    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    /* (3) find user by hashedResetToken and resetTokenExpire */
    const user = await userController.getOne({
      "passwordData.hashedResetToken": hashedResetToken,
      "passwordData.resetTokenExpire": { $gt: Date.now() },
    });

    /* (4) store the new password */
    user.password = password;

    /* (5) save user in database */
    await user.save();

    /* (6) remove password data from output */
    user.passwordData = undefined;

    /* (7) sign token */
    const token = jwt.signToken(user);

    /* (8) send response */
    res.status(200).json({
      results: 1,
      status: "Success",
      statusCode: 200,
      message: "Password is reset and then updated.",
      data: {
        user: {
          userData: user,
          token: token,
        },
      },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

// const restrictTo = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role))
//       return next(new AppError({ message: `${req.user.role}s are not allowed to access this page}` }, 403));

//     next();
//   };
// };

/* EXPORTS */
module.exports = { signup, signin, protectRoute, forgotPassword, resetPassword };
