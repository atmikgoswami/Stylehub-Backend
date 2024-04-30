const User = require('../models/user');
const Product = require('../models/product');
const BigPromise = require('../middleware/bigPromise');
const CustomError = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary')
const crypto = require('crypto');

exports.signup = BigPromise(async (req,res,next)=>{

    if(!req.files){
        return next(new CustomError("Photo is required for signup",400));
    }

    const {name,email,mobile,password} = req.body;

    if(!email || !name || !password || !mobile){
        return next(new CustomError('Name, email, mobile and password are required',400))
    }

    let file = req.files.photo;
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: "users",
        width: 150,
        crop: "scale"
    });

    const user = await User.create({
        name,
        email,
        mobile,
        password,
        photo:{
            id: result.public_id,
            secure_url: result.secure_url
        },
    });

    cookieToken(user,res);
});

exports.login = BigPromise(async (req,res,next)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return next(new CustomError('Please provide email and password',400));
    }

    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new CustomError('You are not registered',400));
    }

    const isPasswordCorrect = await user.isValidatedPassword(password);
    if(!isPasswordCorrect){
        return next(new CustomError('Email or password does not match ',400));
    }

    cookieToken(user,res);
});

exports.logout = BigPromise(async (req,res,next)=>{
    res.cookie('token',null,{
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: "Logout success"
    });
});

exports.getCartItems = BigPromise(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    const cartArray = user.cart;

    let products = []
    for (let index = 0; index < cartArray.length; index++) {
        let product = await Product.findById(cartArray[index]);

        products.push(product);
    }

    res.status(200).json({
        success: true,
        products
    });
});

exports.addCartItem = BigPromise(async (req,res,next)=>{

    const user = await User.findById(req.user.id);
    const {productId} = req.body;

    let cartArray = user.cart;

    cartArray.push(productId);

    user.cart = cartArray;

    await user.save();

    res.status(200).json({
        success: true,
        user
    });
});

