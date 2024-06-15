const Product = require("../models/product");
const Warehouse = require("../models/warehouse");
const BigPromise = require("../middleware/bigPromise");
const cloudinary = require("cloudinary");
const CustomError = require("../utils/customError");
const WhereClause = require("../utils/whereClause");
const NodeGeocoder = require("node-geocoder");
const geolib = require("geolib");
const axios = require('axios');

exports.getAllProduct = BigPromise(async (req, res, next) => {
  const resultPerPage = 6;

  //const countProduct = await Product.countDocuments()

  const productsObj = new WhereClause(Product.find(), req.query)
    .search()
    .filter();

  let products = await productsObj.base;
  const filteredProductNumber = products.length;

  productsObj.pager(resultPerPage);
  products = await productsObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    filteredProductNumber,
  });
});

exports.getOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("No product found with this id", 401));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

exports.addReview = BigPromise(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const AlreadyReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (AlreadyReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }

  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

exports.deleteReview = BigPromise(async (req, res, next) => {
  const { productId } = req.query;

  const product = await Product.findById(productId);

  const reviews = product.reviews.filter(
    (rev) => rev.user.toString() !== req.user._id.toString()
  );

  const numberOfReviews = reviews.length;

  const ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await Product.findByIdAndUpdate(
    productId,
    {
      reviews,
      ratings,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
  });
});

exports.getOnlyReviewsPerProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

exports.getStock = BigPromise(async (req, res, next) => {
  const { productId, userPincode } = req.body;
  const product = await Product.findById(productId);

  if (!product) {
    return next(new CustomError("Product not found with this id", 400));
  }

  const warehousesArray = product.warehouses;
  let stock = 0,
    dist = 1e9;

  // Function to get geocode data
  const getGeocode = async (pincode) => {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: pincode,
        format: 'json',
        addressdetails: 1,
      }
    });
    if (response.data.length === 0) {
      throw new Error(`Pincode ${pincode} could not be geocoded`);
    }
    return response.data[0];
  };

  try {
    const userLocation = await getGeocode(userPincode);
    const { lat: lat1, lon: lon1 } = userLocation;

    for (let index = 0; index < warehousesArray.length; index++) {
      let destWarehouse = await Warehouse.findById(warehousesArray[index].warehouse);
      const destLocation = await getGeocode(destWarehouse.postalCode);
      const { lat: lat2, lon: lon2 } = destLocation;

      const distance = geolib.getDistance(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
      );

      if (distance < dist) {
        dist = distance;
        stock = warehousesArray[index].stock;
      }
    }

    let speed = "4 day delivery";
    if (dist <= 10000) {
      speed = "fast delivery";
    } else if (dist >= 100000) {
      speed = "none";
      stock = 0;
    }

    res.status(200).json({
      success: true,
      stock: stock,
      speed: speed,
    });
  } catch (error) {
    return next(new CustomError(error.message, 400));
  }
});

//admin only controllers

exports.addProduct = BigPromise(async (req, res, next) => {
  let imageArray = [];

  if (!req.files) {
    return next(new CustomError("Images are required", 401));
  }

  for (let index = 0; index < req.files.photos.length; index++) {
    let result = await cloudinary.v2.uploader.upload(
      req.files.photos[index].tempFilePath,
      {
        folder: "products",
      }
    );

    imageArray.push({
      id: result.public_id,
      secure_url: result.secure_url,
    });
  }

  req.body.photos = imageArray;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.adminGetAllProduct = BigPromise(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("No product found with this id", 401));
  }

  let imagesArray = [];
  if (req.files) {
    for (let index = 0; index < product.photos.length; index++) {
      const res = await cloudinary.v2.uploader.destroy(
        product.photos[index].id
      );
    }

    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products",
        }
      );

      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
    req.body.photos = imagesArray;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError("No product found with this id", 401));
  }

  //destroy the existing image
  for (let index = 0; index < product.photos.length; index++) {
    const res = await cloudinary.v2.uploader.destroy(product.photos[index].id);
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product was deleted !",
  });
});
