/* OWN MODULES */
const CommentModel = require("../models/comment.model");
const LikeModel = require("../models/like.model");
const AppError = require("../utils/AppError");

/* CONTROLLERS */
const addCommentOnPost = async (req, res, next) => {
  try {
    /* (1) store client input */
    const authorId = req.authUser._id;
    const postId = req.params.postId;
    const content = req.body.content;

    /* (2) create comment */
    const comment = await CommentModel.create({
      author: authorId,
      onPost: postId,
      content: content,
    });

    /* (3) send response */
    res.status(201).json({
      results: 1,
      status: "Success",
      statusCode: 201,
      message: "Created a comment.",
      data: { comment: comment },
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};

const getCommentsOnPost = async (req, res, next) => {
  try {
    /* (1) store client input */
    const postId = req.params.postId;
    const limit = req.params.limit;
    const skipPage = req.params.createdAtOfLastReceived || Date.now();

    /* (2) find comments */
    let comments;
    if (limit === "true") {
      comments = await CommentModel.find({ onPost: postId, createdAt: { $lt: skipPage } })
        .sort("-createdAt")
        .limit(5);
    } else {
      comments = await CommentModel.find({ onPost: postId, createdAt: { $lt: skipPage } }).sort("-createdAt");
    }

    const count = await CommentModel.countDocuments({ onPost: postId });

    /* (3) send response */
    res.status(200).json({
      results: comments.length,
      status: "Success",
      statusCode: 200,
      message: `Found comments.`,
      data: { comments: comments, count: count },
    });
  } catch (err) {
    next(new AppError(err, 404));
  }
};

const deleteCommentOnPost = async (req, res, next) => {
  try {
    /* (1) store client input */
    const authorId = req.authUser._id;
    const commentId = req.params.commentId;

    /* (2) find comment */
    const comment = await CommentModel.findById(commentId);
    if (!comment) return next(new AppError({ message: "Comment doesn't exist." }, 404));

    /* (3) check if comment belongs to authUser */
    if (String(comment.author._id) !== String(authorId))
      return next(new AppError({ message: "Not authorized to delete this comment." }, 401));

    /* (4) delete comment */
    await CommentModel.findByIdAndDelete(commentId);

    /* (5) delete comment related data */
    await LikeModel.deleteMany({ onPostOnComment: commentId });

    /* (6) send response */
    res.status(204).json({
      results: 1,
      status: "Success",
      statusCode: 204,
      message: "Deleted a comment.",
    });
  } catch (err) {
    next(new AppError(err, 400));
  }
};

/* EXPORTS */
module.exports = { addCommentOnPost, getCommentsOnPost, deleteCommentOnPost };
