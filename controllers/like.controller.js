/* OWN MODULES */
const LikeModel = require("../models/like.model");
const AppError = require("../utils/AppError");

/* CONTROLLERS */
const like = async (req, res, next) => {
  try {
    /* (1) store client input */
    const likedById = req.authUser._id;
    const docId = req.params.commentId || req.params.postId;

    let onModel;
    if (req.params.postId) onModel = "Post";
    if (req.params.commentId) onModel = "Comment";

    /* (2) unlike if liked before */
    const canUnlike = await LikeModel.findOneAndDelete({
      likedBy: likedById,
      onPostOnComment: docId,
    });

    /* (3) like if not liked before */
    if (!canUnlike) {
      await LikeModel.create({
        likedBy: likedById,
        onPostOnComment: docId,
        onModel: onModel,
      });
    }

    /* (4) send response */
    res.status(201).json({
      results: canUnlike ? 0 : 1,
      status: "Success",
      statusCode: 201,
      message: `${onModel} ${canUnlike ? "unliked" : "liked"}.`,
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};

/* EXPORTS */
module.exports = { like };
