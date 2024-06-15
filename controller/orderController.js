const Order = require("../models/order");
const Product = require("../models/product");
const BigPromise = require("../middleware/bigPromise");
const CustomError = require("../utils/customError");
const warehouse = require("../models/warehouse");

exports.createOrder = BigPromise(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    warehouse,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    warehouse,
    taxAmount,
    shippingAmount,
    totalAmount,
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getOneOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new CustomError("Invalid order id", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getLoggedInOrder = BigPromise(async (req, res, next) => {
  const order = await Order.find({ user: req.user._id });

  if (!order) {
    return next(new CustomError("Invalid order id", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.admingetAllOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find();

  res.status(200).json({
    success: true,
    orders,
  });
});

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (order.orderStatus === "Delivered") {
    return next(new CustomError("Order is already delivered", 401));
  }

  order.orderStatus = req.body.orderStatus;

  for (const orderItem of order.orderItems) {
    await updateProductStock(order.warehouse.toString(), orderItem.product.toString(), orderItem.quantity);
  }

  await order.save();

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new CustomError("Invalid order id", 401));
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    message: "Order was deleted !",
  });
});

async function updateProductStock(warehouseId, productId, quantity) {

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const warehouseEntry = product.warehouses.find(
    (entry) => entry.warehouse.toString() === warehouseId
  );

  if (!warehouseEntry) {
    throw new Error(`Warehouse with ID ${warehouseId} not found in product`);
  }

  warehouseEntry.stock -= quantity;

  await product.save({ validateBeforeSave: false });
}
