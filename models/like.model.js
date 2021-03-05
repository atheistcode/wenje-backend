/* DEPENDENCIES */
const mongoose = require("mongoose");

/* SCHEMA DEFINITION */
const likeSchemaOptions = {
  timestamps: true,
};

const LikeSchema = new mongoose.Schema(
  {
    likedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Like must belong to a user."],
    },
    onPostOnComment: {
      type: mongoose.Schema.ObjectId,
      ref: "onModel",
      required: [true, "Like must belong to a post or a comment."],
    },
    onModel: {
      type: String,
      required: true,
      enum: ["Post", "Comment"],
    },
  },
  likeSchemaOptions
);

/* SCHEMA COMPILATION TO MODEL */
const LikeModel = mongoose.model("Like", LikeSchema);

/* DEFAULT EXPORT */
module.exports = LikeModel;
