/* OWN MODULES */
const UserModel = require("../models/user.model");
const PostModel = require("../models/post.model");
const CommentModel = require("../models/comment.model");
const LikeModel = require("../models/like.model");
const jwt = require("../utils/jwt");
const { deleteImage } = require("../utils/cloudinary");
const AppError = require("../utils/AppError");
// const sendEmail = require("../utils/SendEmail");

/* CONTROLLERS */
const create = async (userObj) => {
  try {
    /* (1) create user */
    const user = await UserModel.create(userObj);

    /* (2) return user */
    return user;
  } catch (err) {
    throw new AppError(err, 400);
  }
};

const getOne = async (findObj) => {
  try {
    /* (1) find user */
    const user = await UserModel.findOne(findObj).select(
      "+passwordData.hashedPassword +passwordData.encryptionSalt +passwordData.passwordUpdatedAt +passwordData.hashedResetToken +passwordData.resetTokenExpire"
    );

    /* (2) check if user is exist */
    if (!user) {
      if (findObj.email) {
        throw new AppError({ message: "Invalid login email address or password." }, 404);
      } else if (findObj["passwordData.hashedResetToken"]) {
        throw new AppError({ message: "Password reset URL is invalid or has expired." }, 404);
      } else if (findObj._id) {
        throw new AppError({ message: "Please sign in to access this route." }, 401);
      } else {
        throw new AppError({ message: "User doesn't exist." }, 404);
      }
    }

    /* (3) return user */
    return user;
  } catch (err) {
    throw new AppError(err, 400);
  }
};

const getById = async (id) => {
  try {
    /* (1) store client input */
    const userId = id;

    /* (2) find user */
    const user = await UserModel.findById(userId).select(
      "+passwordData.hashedPassword +passwordData.encryptionSalt +passwordData.passwordUpdatedAt +passwordData.hashedResetToken +passwordData.resetTokenExpire"
    );

    /* (3) check if user is exist */
    if (!user) throw new AppError({ message: "User doesn't exist." }, 404);

    /* (4) return user */
    return user;
  } catch (err) {
    throw new AppError(err, 400);
  }
};

const getByParamId = async (req, res, next) => {
  try {
    /* (1) store client input */
    const userId = req.params.userId;

    /* (2) find user */
    const user = await UserModel.findById(userId).populate("following followers", "_id name bio country image");

    /* (3) check if user is exist */
    if (!user) return next(new AppError({ message: "User doesn't exist." }, 404));

    /* (4) send response */
    res.status(200).json({
      results: 1,
      status: "Success",
      statusCode: 200,
      message: "Found user.",
      data: { userData: user },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const getMe = async (req, res, next) => {
  req.params.userId = req.authUser._id;

  next();
};

const update = async (req, res, next) => {
  try {
    /* (1) store client input */
    const userId = req.authUser._id;
    const { name, email, bio, country } = req.body;
    const updateObj = { name: name, email: email, bio: bio, country: country };

    /* (2) check if client input is complete */
    if (!name && !email && !bio && !country)
      return next(new AppError({ message: "Please provide fields need to be updated." }, 400));

    /* (3) filter req.body */
    const filterObj = (obj, [...allowedFields]) => {
      const newObj = {};

      Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el) && obj[el] != undefined) newObj[el] = obj[el];
      });

      return newObj;
    };

    const filteredUpdateObj = filterObj(updateObj, ["name", "email", "bio", "country"]);

    /* (4) update user */
    const updatedUser = await UserModel.findByIdAndUpdate(userId, filteredUpdateObj, {
      new: true,
      runValidators: true,
    });

    /* (5) send notification email */
    // const messageText = `This is to notify you that your profile on WENJE (following fields: ${Object.keys(
    //   filteredUpdateObj
    // ).join(", ")}) is updated.`;

    // sendEmail({
    //   to: updatedUser.email,
    //   subject: "Your WENJE Profile Is Updated.",
    //   text: messageText,
    // });

    /* (6) send response */
    res.status(200).json({
      results: 1,
      status: "Success",
      statusCode: 200,
      message: "Updated user data.",
      data: { userData: updatedUser },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const uploadImage = async (req, res, next) => {
  try {
    /* (1) store client input */
    const userId = req.authUser._id;
    const dataBody = {};
    if (req.file && req.file.path && req.file.filename) {
      dataBody.image = { url: req.file.path, publicId: req.file.filename };
    } else {
      return next(new AppError({ message: "Please provide an image file needs to be uploaded." }, 400));
    }

    /* (2) update user */
    const updatedUser = await UserModel.findByIdAndUpdate(userId, dataBody, { new: true, runValidators: true });

    /* (3) delete old image */
    await deleteImage(req.authUser.image.publicId);

    /* (4) send response */
    res.status(200).json({
      results: 1,
      status: "Success",
      statusCode: 200,
      message: "Uploaded user image file.",
      data: { userData: updatedUser },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const updatePassword = async (req, res, next) => {
  try {
    /* (1) store client input */
    const userId = req.authUser._id;
    const { currentPassword, password } = req.body;

    /* (2) check if client input is complete */
    if (!currentPassword || !password)
      return next(new AppError({ message: "Please provide current password, and new password." }, 400));

    /* (3) find user */
    const user = await getById(userId);

    /* (4) validate client password */
    const isPasswordValid = user.comparePassword(currentPassword, user.passwordData.hashedPassword);

    if (!isPasswordValid) return next(new AppError({ message: "Invalid password." }, 401));

    /* (5) update password and passwordConfirm fields */
    user.password = password;

    await user.save();

    /* (6) sign token */
    const token = jwt.signToken(user);

    /* (7) send notification email */
    // const messageText = `This is to notify you that your WENJE password is updated.`;

    // await sendEmail({
    //   to: user.email,
    //   subject: "Your WENJE Password Is Updated.",
    //   text: messageText,
    // });

    /* (8) send response */
    res.status(200).json({
      results: 1,
      status: "Success",
      statusCode: 200,
      message: "Updated user password.",
      data: {
        user: {
          token: token,
        },
      },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const deleteOne = async (req, res, next) => {
  try {
    /* (1) store client input */
    const userId = req.authUser._id;
    const { email, password } = req.body;

    /* (2) check if client input is complete */
    if (!email || !password)
      return next(new AppError({ message: "Please provide login email address and password." }, 400));

    /* (3) check if email belongs to logged in user */
    if (email !== req.authUser.email)
      return next(new AppError({ message: "Invalid login email address or password." }, 401));

    /* (4) find user */
    const user = await getById(userId);

    /* (5) validate client password */
    const isPasswordValid = await user.comparePassword(password, user.passwordData.hashedPassword);

    if (!isPasswordValid) return next(new AppError({ message: "Invalid login email address or password." }, 401));

    /* (6) remove user from other users following and followers lists */
    const followingList = user.following;
    const followersList = user.followers;

    followersList.forEach(async (followerId) => {
      await UserModel.findByIdAndUpdate(
        followerId,
        { $pull: { following: userId } },
        { new: true, runValidators: true }
      );
    });

    followingList.forEach(async (followingId) => {
      await UserModel.findByIdAndUpdate(
        followingId,
        { $pull: { followers: userId } },
        { new: true, runValidators: true }
      );
    });

    /* (7) delete user */
    await deleteImage(user.image.publicId);
    await UserModel.findByIdAndDelete({ _id: userId });

    /* (8) delete user related data */
    await PostModel.deleteMany({ author: userId });
    await CommentModel.deleteMany({ author: userId });
    await LikeModel.deleteMany({ likedBy: userId });

    /* (9) send response */
    res.status(204).json({
      results: 0,
      status: "Success",
      statusCode: 204,
      message: `Deleted user "${user.email}".`,
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const getAll = async (req, res, next) => {
  try {
    /* (1) find users */
    const users = await UserModel.find().populate("following followers", "_id name bio country image");

    /* (2) send response */
    res.status(200).json({
      results: users.length,
      status: "Success",
      statusCode: 200,
      message: "Sent all users search results.",
      data: { users: users },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const searchByName = async (req, res, next) => {
  try {
    /* (1) store client input */
    if (req.query.byName === "" || req.query.byName === " ") {
      res.status(200).json({
        results: 0,
        status: "Success",
        statusCode: 200,
        message: "Nothing found.",
        data: { users: null },
      });
      return;
    }

    const searchString = new RegExp(`${req.query.byName}`, "i");

    /* (2) find users */
    const users = await UserModel.find({ name: searchString }).select("_id name image");

    /* (3) send response */
    res.status(200).json({
      results: users.length,
      status: "Success",
      statusCode: 200,
      message: "Sent users search by name results.",
      data: { users: users },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const addFollowing = async (req, res, next) => {
  try {
    /* (1) store client input */
    userId = req.authUser._id;
    followId = req.body.followId;

    /* (2) check if client input is complete */
    if (!followId) return next(new AppError({ message: "Please provide ID of the user to be followed." }, 400));

    /* (3) check if userId is not equal to followId */
    if (String(userId) === String(followId))
      return next(new AppError({ message: "User ID is same as ID of the user to be followed." }, 400));

    /* (4) update my following list */
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { following: followId } },
      { new: true, runValidators: true }
    );

    /* (5) go to next middleware */
    req.authUser = user;
    next();
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const addFollower = async (req, res, next) => {
  try {
    /* (1) store client input */
    userId = req.authUser._id;
    followId = req.body.followId;

    /* (2) update a user followers list */
    const followedUser = await UserModel.findByIdAndUpdate(
      followId,
      { $addToSet: { followers: userId } },
      { new: true, runValidators: true }
    ).populate("following followers", "_id name image");

    /* (3) send response */
    res.status(201).json({
      results: 1,
      status: "Success",
      statusCode: 201,
      message: "Followed a user.",
      data: { user: req.authUser },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const deleteFollowing = async (req, res, next) => {
  try {
    /* (1) store client input */
    userId = req.authUser._id;
    unfollowId = req.body.unfollowId;

    /* (2) check if client input is complete */
    if (!unfollowId) return next(new AppError({ message: "Please provide ID of the user to be unfollowed." }, 400));

    /* (3) update my following list */
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { following: unfollowId } },
      { new: true, runValidators: true }
    );

    /* (4) go to next middleware */
    req.authUser = user;
    next();
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const deleteFollower = async (req, res, next) => {
  try {
    /* (1) store client input */
    userId = req.authUser._id;
    unfollowId = req.body.unfollowId;

    /* (2) update a user followers list */
    const user = await UserModel.findByIdAndUpdate(
      unfollowId,
      { $pull: { followers: userId } },
      { new: true, runValidators: true }
    ).populate("following followers", "_id name image");

    /* (3) send response */
    res.status(201).json({
      results: 0,
      status: "Success",
      statusCode: 201,
      message: "Unfollowed a user.",
      data: { user: req.authUser },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

const findPeople = async (req, res, next) => {
  try {
    /* (1) store excluded users */
    const excludedUsers = req.authUser.following;
    excludedUsers.push(req.authUser._id);

    /* (2) find users */
    whoToFollow = await UserModel.find({ _id: { $nin: excludedUsers } })
      .select("_id name image country bio")
      .limit(20);

    /* (3) send response */
    res.status(200).json({
      results: whoToFollow.length,
      status: "Success",
      statusCode: 200,
      message: "Sent who to follow search results.",
      data: { whoToFollow: whoToFollow },
    });
  } catch (err) {
    return next(new AppError(err, 400));
  }
};

/* EXPORTS */
module.exports = {
  create,
  getOne,
  getById,
  getByParamId,
  getMe,
  update,
  uploadImage,
  updatePassword,
  deleteOne,
  getAll,
  searchByName,
  addFollowing,
  addFollower,
  deleteFollowing,
  deleteFollower,
  findPeople,
};
