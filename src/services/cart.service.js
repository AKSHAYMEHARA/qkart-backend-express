const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  // try {
  const cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  return cart;
  // } catch (error) {
  //   throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  // }
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  // try {
  let userCart;
  userCart = await Cart.findOne({ email: user.email });
  let product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }
  if (!userCart) {
    const cart = Cart.create({
      email: user.email,
      cartItems: [{ product: product, quantity: quantity }],
    });
    if (!cart) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR);
    }
    return cart;
  }

  if (userCart.cartItems && userCart.cartItems.length > 0) {
    if (
      userCart.cartItems.find(
        (prod) => prod.product._id.toString() === productId.toString()
      )
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product already in cart. Use the cart sidebar to update or remove product from cart"
      );
    } else if (
      userCart.cartItems.find(
        (prod) => prod.product._id.toString() !== productId.toString()
      )
    ) {
      // userCart = await Cart.findOneAndUpdate(
      //   { email: user.email },
      //   {
      //     $push: {
      //       cartItems: { product: product, quantity: quantity },
      //     },
      //   },
      //   { new: true }
      // );
      // return userCart;
      userCart.cartItems.push({ product: product, quantity: quantity });
      await userCart.save();
      return userCart;
    }
  } else {
    // userCart = await Cart.findOneAndUpdate(
    //   { email: user.email },
    //   {
    //     $push: {
    //       cartItems: { product: product, quantity: quantity },
    //     },
    //   },
    //   { new: true }
    // );
    // return userCart;
    userCart.cartItems.push({ product: product, quantity: quantity });
    await userCart.save();
    return userCart;
  }
  // } catch (error) {
  //   console.log(error);
  // }
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  // try {
  const cart = await Cart.findOne({ email: user.email });
  const product = await Product.findById({ _id: productId });

  if (!cart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    );
  }

  if (!product) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }
  let productIndex = -1;
  for (let i = 0; i < cart.cartItems.length; i++) {
    if (productId == cart.cartItems[i].product._id) {
      productIndex = i;
    }
  }

  // If product not in cart, throw error. Otherwise, increment qty
  if (productIndex == -1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  } else {
    cart.cartItems[productIndex].quantity = quantity;
  }

  await cart.save();

  return cart;
  // if (userCart) {
  //   if (
  //     userCart.cartItems.every(
  //       (prod) => prod.product._id.toString() !== productId.toString()
  //     )
  //   ) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  //   } else {
  //     const cart = await Cart.findOneAndUpdate(
  //       {
  //         email: user.email,
  //         cartItems: { $elemMatch: { "product._id": productId } },
  //       },
  //       { $set: { "cartItems.$.quantity": quantity } },
  //       { new: true }
  //     );
  //     return cart;
  //   }
  // }
  // } catch (error) {
  //   console.log(error);
  // }
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  // try {
  const userCart = await Cart.findOne({ email: user.email });

  if (!userCart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
  }

  if (userCart) {
    if (
      userCart.cartItems.every(
        (prod) => prod.product._id.toString() !== productId.toString()
      )
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
    } else {
      const cart = await Cart.findOneAndUpdate(
        {
          email: user.email,
        },
        { $pull: { cartItems: { "product._id": productId } } }
      );
      return cart;
    }
  }
  // } catch (error) {
  //   console.log(error);
  // }
};
// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  const { email } = user;
  const userCart = await Cart.findOne({
    email,
  });
  if (!userCart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart.");
  }
  if (userCart.cartItems && userCart.cartItems.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have any Items in cart."
    );
  }
  const hasSetNonDefaultAddress = await user.hasSetNonDefaultAddress();
  if (!hasSetNonDefaultAddress) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Address not set");
  
  }

  const cartAmount = userCart.cartItems && userCart.cartItems
    .map((item) => item.product.cost * item.quantity)
    .reduce((previousValue, currentValue) => {
      return previousValue + currentValue;
    });

  if (user.walletMoney < cartAmount) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient Balance");
  }

  userCart.cartItems = [];
  user.walletMoney -= cartAmount;
  await userCart.save();
  await user.save();
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
