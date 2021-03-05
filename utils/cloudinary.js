/* DEPENDENCIES */
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/* CONFIGURE MODULES */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wenje/profile-images",
    allowed_formats: ["jpg", "png", "jpeg"],
    // TODO: add transformations
    //   transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const postImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wenje/post-images",
    allowed_formats: ["jpg", "png", "jpeg"],
    // TODO: add transformations
    //   transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const uploadProfileImage = multer({ storage: profileImageStorage }).single("image");
const uploadPostImage = multer({ storage: postImageStorage }).single("image");

const deleteImage = async (public_id) => await cloudinary.uploader.destroy(public_id);

/* DEFAULT EXPORT */
module.exports = { uploadProfileImage, uploadPostImage, deleteImage };
