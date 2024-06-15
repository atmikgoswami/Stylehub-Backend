const User = require("../models/user");
const Product = require("../models/product");
const BigPromise = require("../middleware/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary");
const mailHelper = require('../utils/emailHelper');
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
  if (!req.files) {
    return next(new CustomError("Photo is required for signup", 400));
  }

  const { name, email, mobile, password } = req.body;

  if (!email || !name || !password || !mobile) {
    return next(
      new CustomError("Name, email, mobile and password are required", 400)
    );
  }

  let file = req.files.photo;
  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });

  const user = await User.create({
    name,
    email,
    mobile,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.log(req);
    return next(new CustomError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new CustomError("You are not registered", 400));
  }

  const isPasswordCorrect = await user.isValidatedPassword(password);
  if (!isPasswordCorrect) {
    return next(new CustomError("Email or password does not match ", 400));
  }

  cookieToken(user, res);
  console.log("Login successfull");
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logout success",
  });
});

exports.forgotPassword = BigPromise(async (req,res,next)=>{
  const {email} = req.body;

  const user = await User.findOne({email});

  if(!user){
      return next(new CustomError('Email not registered',400));
  }

  const forgotToken = user.getForgotPasswordToken()

  await user.save({validateBeforeSave: false})

  const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`

  const message = `Copy paste this link in ur URL and hit enter \n\n ${myUrl}`

  try {
      await mailHelper({
          email: user.email,
          subject: "T-shirt Store : Password reset email",
          message,
      });

      res.status(200).json({
          success: true,
          message: "Email sent successfully"
      })
  } catch (error) {
      user.forgotPasswordToken = undefined
      user.forgotPasswordExpiry = undefined
      await user.save({validateBeforeSave: false})

      return next(new CustomError(error.message,500));
  }
});

exports.passwordReset = BigPromise(async (req,res,next)=>{
  const token = req.params.token;
  const encryToken = crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

  //console.log(encryToken);

  const user = await User.findOne({
      forgotPasswordToken: encryToken,
      forgotPasswordExpiry: {$gt: Date.now()}
  });

  if(!user){
      return next(new CustomError('Token is invalid or expired',400));
  }

  if(req.body.password != req.body.confirmPassword){
      return next(new CustomError('Password and Confirm Password do not match',400));
  }

  user.password = req.body.password
  user.forgotPasswordToken = undefined
  user.forgotPasswordExpiry = undefined
  await user.save();

  cookieToken(user,res);

});

exports.changePassword = BigPromise(async (req,res,next)=>{
  const userId = req.user.id
  
  const user = await User.findById(userId).select("+password");

  const isCorrectOldPassword = await user.isValidatedPassword(req.body.oldPassword)

  if(!isCorrectOldPassword){
      return next(new CustomError('Old password is incorrect',400));
  }

  user.password = req.body.password;

  await user.save();

  cookieToken(user,res);
});

exports.getCartItems = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  const cartArray = user.cart;

  let products = [];
  for (let index = 0; index < cartArray.length; index++) {
    let product = await Product.findById(cartArray[index]);

    products.push(product);
  }

  res.status(200).json({
    success: true,
    products,
  });
});

exports.addCartItem = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  const { productId } = req.body;

  let cartArray = user.cart;

  cartArray.push(productId);

  user.cart = cartArray;

  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

exports.deleteCartItem = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  const { productId } = req.body;

  let cartArray = user.cart;
  let itemRemoved = false;

  for (let index = 0; index < cartArray.length; index++) {
    if (cartArray[index]._id.toString() === productId) {
      cartArray.splice(index, 1);
      itemRemoved = true;
      break;
    }
  }

  if (!itemRemoved) {
    return res.status(404).json({
      success: false,
      message: "No such product exists in cart",
    });
  }

  user.cart = cartArray;
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

exports.addAddress = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const { name, address, city, phoneNo, postalCode, state, country } = req.body;

  const existingAddress = user.shippinginfo.find((addr) => addr.name === name);

  if (existingAddress) {
    res.status(400).json({
      success: false,
      message: "Address with same name already exists",
    });
  }

  user.shippinginfo.push({
    name: name.toLowerCase(),
    address,
    city,
    phoneNo,
    postalCode,
    state,
    country,
  });

  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updateaddress = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(400).json({
      success: false,
      message: "No user found",
    });
  }

  const { name, address, city, phoneNo, postalCode, state, country } = req.body;

  let addressArray = user.shippinginfo;
  let addressUpdated = false;

  for (let index = 0; index < addressArray.length; index++) {
    if (addressArray[index].name === name.toLowerCase()) {
      addressArray[index].address = address;
      addressArray[index].city = city;
      addressArray[index].phoneNo = phoneNo;
      addressArray[index].postalCode = postalCode;
      addressArray[index].state = state;
      addressArray[index].country = country;
      addressUpdated = true;
      break;
    }
  }

  if (!addressUpdated) {
    return res.status(404).json({
      success: false,
      message: "Address not found for update",
    });
  }

  user.shippinginfo = addressArray;
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

exports.deleteaddress = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "No user found",
    });
  }

  const { name } = req.body;
  let addressArray = user.shippinginfo;
  let addressRemoved = false;

  for (let index = 0; index < addressArray.length; index++) {
    if (addressArray[index].name === name.toLowerCase()) {
      addressArray.splice(index, 1);
      addressRemoved = true;
      break;
    }
  }

  if (!addressRemoved) {
    return res.status(404).json({
      success: false,
      message: "Address not found for removal",
    });
  }

  user.shippinginfo = addressArray;
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return next(new CustomError("Provide both name and email", 400));
  }

  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  if (req.files) {
    const user = await User.findById(req.user.id);
    const imageId = user.photo.id;

    //delete photo on cloudinary
    const resp = await cloudinary.uploader.destroy(imageId);

    //upload photo
    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "users",
        width: 150,
        crop: "scale",
      }
    );

    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
});

//admin controllers
exports.adminAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});
