//===================================
//     Server
//===================================
const express = require("express");
const app = express();


const cors = require("cors");
app.use(cors());

const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

const { default: mongoose } = require("mongoose");
mongoose.connect("mongodb://localhost:27017/native").then(() => {
  console.log("mongodb connected");
});

// Import schemas
const Users = require("./model/Users");
const Products = require("./model/Products");
const Category = require("./model/Category");
const Cart = require("./model/Cart");
const Wishlist = require("./model/Wishlist");
const Address = require("./model/Address");
const Review = require("./model/Review");

// Ensure legacy indexes don't break per-user isolation
mongoose.connection.once("open", async () => {
  try {
    // Old schema used `productId` as unique globally. Drop if still present.
    await Cart.collection.dropIndex("productId_1");
  } catch (_e) {
    // ignore if index doesn't exist
  }
  try {
    await Wishlist.collection.dropIndex("productId_1");
  } catch (_e) {
    // ignore if index doesn't exist
  }
});
const Orders = require("./model/Order");


// ==========================================
// USER ROUTES
// ==========================================

// signup ------------
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.json({ status: false, message: "User already exists" });
    }
    const newUser = await Users.create({ email, password });
    res.json({ status: true, user: newUser });
  } catch (error) {
    res.json({ status: false, message: "An error occurred" });
  }
});

// signin ---------------------
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email, password });
    if (user) {
      res.json({ status: true, user });
    } else {
      res.json({ status: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.json({ status: false, message: "An error occurred" });
  }
});

// get user by email ----------
app.get("/get-user/:email", async (req, res) => {
  try {
    const user = await Users.findOne({ email: req.params.email });
    if (!user) {
      return res.json({ status: false, message: "User not found" });
    }
    res.json({ status: true, user });
  } catch (error) {
    res.json({ status: false, message: "An error occurred" });
  }
});

// get all users ----------
app.get("/users", async (req, res) => {
  try {
    const users = await Users.find().sort({ _id: -1 });
    res.json({ status: true, users });
  } catch (error) {
    res.json({ status: false, message: "An error occurred while fetching the users." });
  }
});

// update user -------------
app.put("/users/:id", async (req, res) => {
  try {
    const updated = await Users.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.json({ status: false, message: "User not found" });
    }
    res.json({ status: true, message: "User updated successfully" });
  } catch (error) {
    res.json({ status: false, message: "An error occurred while updating the user." });
  }
});

// delete user -------------
app.delete("/users/:id", async (req, res) => {
  try {
    const deleted = await Users.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.json({ status: false, message: "User not found" });
    }
    res.json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    res.json({ status: false, message: "An error occurred while deleting the user." });
  }
});



// update profile -------------
app.post("/update-profile", async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    const updatedUser = await Users.findOneAndUpdate(
      { email },
      { $set: { name, phone } },
      { new: true },
    );

    if (!updatedUser) {
      return res.json({ status: false, message: "User not found" });
    }

    res.json({ status: true, updatedUser });
  } catch (error) {
    res.json({ status: false, message: "An error occurred" });
  }
});

// resetpassword ---------------
app.delete("/users/:email", async (req, res) => {
  try {
    const deletedUser = await Users.findOneAndDelete({ email: req.params.email });
    if (deletedUser) {
      res.json({ status: true, message: "User deleted successfully" });
    } else {
      res.json({ status: false, message: "User not found" });
    }
  } catch (error) {
    res.json({ status: false, message: "An error occurred" });
  }
});

app.post("/resetpassword", async (req, res) => {
  try {
    const { email, password } = req.body;
    const updatePassword = await Users.findOneAndUpdate(
      { email },
      { $set: { password } },
    );
    if (updatePassword) {
      res.json({ status: true, updatedPassword: updatePassword });
    } else {
      res.json({ status: false, message: "User not found" });
    }
  } catch (error) {
    res.json({ status: false, message: "An error occurred" });
  }
});

//===================================
//        Address Route
//===================================

// Add new address
app.post("/add-address", async (req, res) => {
  try {
    const email = req.body.email || req.body.userEmail;
    if (!email) {
      return res.json({ status: false, message: "Email is required" });
    }

    if (req.body.isDefault) {
      await Address.updateMany({ email }, { isDefault: false });
    }
    const newAddress = await Address.create({ ...req.body, email });
    res.json({ status: true, address: newAddress });
  } catch (error) {
    res.json({ status: false, message: "Error adding address" });
  }
});

// Get addresses by user email
// Server.js mein address query
app.get("/get-addresses/:email", async (req, res) => {
    const addresses = await Address.find({ email: req.params.email }); // Model field 'email' hai
    res.json({ status: true, addresses });
});

// Set default address
app.post("/set-default-address", async (req, res) => {
  try {
    const { id, email } = req.body;
    await Address.updateMany({ email }, { isDefault: false });
    await Address.findByIdAndUpdate(id, { isDefault: true });
    res.json({ status: true, message: "Default address updated" });
  } catch (error) {
    res.json({ status: false, message: "Error" });
  }
});

// Delete address
app.delete("/delete-address/:id", async (req, res) => {
  try {
    // Sirf wahi address delete ho jo is user ka ho (Security)
    await Address.findByIdAndDelete(req.params.id);
    res.json({ status: true, message: "Address deleted" });
  } catch (error) {
    res.json({ status: false });
  }
});

// Update address
app.put("/update-address/:id", async (req, res) => {
  try {
    const updatedAddress = await Address.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    );
    if (!updatedAddress) {
      return res.json({ status: false, message: "Address not found" });
    }
    res.json({ status: true, address: updatedAddress });
  } catch (error) {
    res.json({ status: false, message: "Error updating address" });
  }
});

// ==========================================
// ORDERS ROUTES
// ==========================================
app.get("/get-user-orders/:email", async (req, res) => {
  try {
    const userOrders = await Orders.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json({ status: true, orders: userOrders });
  } catch (error) {
    res.json({ status: false, message: "Server error" });
  }
});

app.post("/place-order", async (req, res) => {
  try {
    const newOrder = await Orders.create(req.body);
    res.json({ status: true, message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Order Error:", error);
    res.json({ status: false, message: "Failed to place order" });
  }
});

// Get all orders (Admin)
app.get("/orders", async (req, res) => {
  try {
    const allOrders = await Orders.find().sort({ createdAt: -1 });
    res.json({ status: true, orders: allOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.json({ status: false, message: "Failed to fetch orders" });
  }
});

// Get single order by ID
app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Orders.findById(req.params.id);
    if (!order) {
      return res.json({ status: false, message: "Order not found" });
    }
    res.json({ status: true, order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.json({ status: false, message: "Failed to fetch order" });
  }
});

// Update order status
app.put("/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.json({ status: false, message: "Status is required" });
    }
    
    const updatedOrder = await Orders.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.json({ status: false, message: "Order not found" });
    }
    
    res.json({ status: true, message: "Order updated successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.json({ status: false, message: "Failed to update order" });
  }
});

// Server.js mein add karein
app.delete("/clear-cart/:email", async (req, res) => {
  try {
    const { email } = req.params;
    await Cart.deleteMany({ userEmail: email }); // User ke saare items delete karein
    res.json({ status: true, message: "Cart cleared" });
  } catch (error) {
    res.json({ status: false, message: "Error clearing cart" });
  }
});


// ==========================================
// PRODUCTS ROUTES
// ==========================================

// addproducts ---------------------
app.post("/products", async (req, res) => {
  try {
    let ouritems = new Products({
      title: req.body.title,
      weight: req.body.weight,
      category: req.body.category,
      unit: req.body.unit,
      description: req.body.description,
      regularPrice: req.body.regularPrice,
      salePrice: req.body.salePrice,
      stockStatus: req.body.stockStatus,
      productCode: req.body.productCode,
      productSku: req.body.productSku,
      status: req.body.status,
      image: req.body.image,
    });

    let result = await ouritems.save();

    if (result) {
      res.json({
        status: true,
        message: "Product added successfully",
      });
    } else {
      res.json({
        status: false,
        message: "Failed to add product",
      });
    }
  } catch (error) {
    console.error("Error adding product:", error);
    res.json({
      status: false,
      message: "Internal server error",
    });
  }
});

// get all products ----------------
app.get("/products", async (req, res) => {
  try {
    let products = await Products.find();
    res.json({
      status: true,
      products: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.json({ status: false, message: error.message });
  }
});

// get product by id ----------------
app.get("/products/:id", async (req, res) => {
  try {
    const lookupValue = String(req.params.id || "").trim();
    if (!lookupValue) {
      return res.json({ status: false, message: "Product id required" });
    }
    if (!mongoose.Types.ObjectId.isValid(lookupValue)) {
      return res.json({ status: false, message: "Invalid product id" });
    }
    const product = await Products.findById(lookupValue);
    if (!product) {
      return res.json({ status: false, message: "Product not found" });
    }
    res.json({ status: true, product });
  } catch (error) {
    res.json({ status: false, message: "Internal server error" });
  }
});

// ==========================================
// REVIEWS ROUTES
// ==========================================
app.get("/products/:id/reviews", async (req, res) => {
  try {
    const productId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.json({ status: false, message: "Invalid product id" });
    }
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.json({ status: true, reviews });
  } catch (error) {
    res.json({ status: false, message: "Error fetching reviews" });
  }
});

app.post("/products/:id/reviews", async (req, res) => {
  try {
    const productId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.json({ status: false, message: "Invalid product id" });
    }

    const { userEmail, userName, userAvatarUrl, rating, title, body } = req.body || {};
    if (!userEmail || !userName) {
      return res.json({ status: false, message: "userEmail and userName are required" });
    }
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.json({ status: false, message: "rating must be 1-5" });
    }

    const created = await Review.create({
      productId,
      userEmail,
      userName,
      userAvatarUrl: userAvatarUrl || "",
      rating: numericRating,
      title: String(title || ""),
      body: String(body || ""),
    });

    res.json({ status: true, review: created });
  } catch (error) {
    res.json({ status: false, message: "Error creating review" });
  }
});

app.post("/reviews/:reviewId/react", async (req, res) => {
  try {
    const reviewId = String(req.params.reviewId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.json({ status: false, message: "Invalid review id" });
    }
    const type = String(req.body?.type || "").trim(); // "helpful" | "dislike"
    if (!["helpful", "dislike"].includes(type)) {
      return res.json({ status: false, message: "Invalid reaction type" });
    }

    const inc = type === "helpful" ? { helpfulCount: 1 } : { dislikeCount: 1 };
    const updated = await Review.findByIdAndUpdate(reviewId, { $inc: inc }, { new: true });
    if (!updated) {
      return res.json({ status: false, message: "Review not found" });
    }
    res.json({ status: true, review: updated });
  } catch (error) {
    res.json({ status: false, message: "Error reacting to review" });
  }
});

app.get("/reviews", async (_req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate("productId", "title");
    res.json({ status: true, reviews });
  } catch (error) {
    res.json({ status: false, message: "Error fetching dashboard reviews" });
  }
});

app.delete("/reviews/:reviewId", async (req, res) => {
  try {
    const reviewId = String(req.params.reviewId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.json({ status: false, message: "Invalid review id" });
    }
    const deleted = await Review.findByIdAndDelete(reviewId);
    if (!deleted) {
      return res.json({ status: false, message: "Review not found" });
    }
    res.json({ status: true, message: "Review deleted successfully" });
  } catch (error) {
    res.json({ status: false, message: "Error deleting review" });
  }
});

// delete product ------------------------
app.delete("/products/:id", async (req, res) => {
  try {
    const lookupValue = String(req.params.id || "").trim();

    if (!lookupValue) {
      return res.json({ status: false, message: "Product id required" });
    }

    if (!mongoose.Types.ObjectId.isValid(lookupValue)) {
      return res.json({ status: false, message: "Invalid product id" });
    }

    const deleted = await Products.findByIdAndDelete(lookupValue);

    if (!deleted) {
      return res.json({ status: false, message: "Product not found" });
    }

    res.json({ status: true, message: "Product deleted from DB" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
});

// update product -------------------------
app.put("/products/:id", async (req, res) => {
  try {
    const updatedProduct = await Products.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    );
    if (updatedProduct) {
      res.json({ status: true, product: updatedProduct });
    } else {
      res.json({ status: false, message: "Product not found" });
    }
  } catch (error) {
    res.json({ status: false, message: "An error occurred" });
  }
});

// ==========================================
// CATEGORY ROUTES
// ==========================================

// addcategory ---------------------
app.post("/categories", async (req, res) => {
  try {
    let category = new Category({
      name: req.body.name,
      image: req.body.image,
      status: req.body.status,
    });

    let result = await category.save();

    if (result) {
      res.json({
        status: true,
        message: "Category added successfully",
      });
    } else {
      res.json({
        status: false,
        message: "Failed to add category",
      });
    }
  } catch (error) {
    console.error("Error adding category:", error);
    res.json({
      status: false,
      message: "Internal server error",
    });
  }
});

// get all categories ----------------
app.get("/categories", async (req, res) => {
  try {
    let categories = await Category.find();
    let categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        let count = await Products.countDocuments({ category: cat.name });
        return { ...cat._doc, productCount: count };
      }),
    );

    res.json({
      status: true,
      categories: categoriesWithCount,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.json({ status: false, message: error.message });
  }
});

// update category -------------------
app.put("/categories/:id", async (req, res) => {
  try {
    const { name, image, status } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          image,
          status,
        },
      },
      { new: true },
    );

    if (updatedCategory) {
      res.json({ status: true, category: updatedCategory });
    } else {
      res.json({ status: false, message: "Category not found" });
    }
  } catch (error) {
    res.json({ status: false, message: "An error occurred" });
  }
});

// delete category -------------------------------
app.delete("/categories/:id", async (req, res) => {
  try {
    const lookupValue = String(req.params.id || "").trim();

    if (!lookupValue) {
      return res.json({
        status: false,
        message: "Category id or name required",
      });
    }

    let deleted = null;

    if (mongoose.Types.ObjectId.isValid(lookupValue)) {
      deleted = await Category.findByIdAndDelete(lookupValue);
    }
    if (!deleted) {
      deleted = await Category.findOneAndDelete({ name: lookupValue });
    }

    if (!deleted) {
      return res.json({ status: false, message: "Category not found" });
    }

    await Products.deleteMany({ category: deleted.name });

    res.json({ status: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Server Error:", error);
    res.json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
});

// ==========================================
// CART ROUTES
// ==========================================
app.get("/cart", async (req, res) => {
  try {
    const { userEmail } = req.query; // Query parameter se email lena
    if (!userEmail) return res.json({ status: false, message: "Email required" });
    
    // Sirf is user ka cart dhoondho
    const cartItems = await Cart.find({ userEmail }).sort({ createdAt: -1 });
    res.json({ status: true, cart: cartItems });
  } catch (error) {
    res.json({ status: false, message: "Error" });
  }
});

app.post("/cart", async (req, res) => {
  try {
    const userEmail = String(req.body.userEmail || "").trim();
    const productId =
      req.body.productId || req.body._id || req.body.productCode;
    if (!userEmail) {
      return res.json({ status: false, message: "userEmail is required" });
    }
    if (!productId) {
      return res.json({ status: false, message: "productId is required" });
    }

    const existingItem = await Cart.findOne({ userEmail, productId });
    if (existingItem) {
      existingItem.quantity =
        (existingItem.quantity || 1) + (req.body.quantity || 1);
      await existingItem.save();
      return res.json({
        status: true,
        message: "Cart updated successfully",
        cartItem: existingItem,
      });
    }

    const cartItem = await Cart.create({
      userEmail,
      productId,
      title: req.body.title,
      weight: req.body.weight,
      category: req.body.category,
      unit: req.body.unit,
      description: req.body.description,
      regularPrice: req.body.regularPrice,
      salePrice: req.body.salePrice,
      stockStatus: req.body.stockStatus,
      productCode: req.body.productCode,
      productSku: req.body.productSku,
      status: req.body.status,
      image: req.body.image,
      quantity: req.body.quantity || 1,
    });

    res.json({ status: true, message: "Added to cart successfully", cartItem });
  } catch (error) {
    console.error("Error saving cart item:", error);
    res.json({ status: false, message: "Internal server error" });
  }
});

app.put("/cart/:productId", async (req, res) => {
  try {
    const userEmail = String(req.body.userEmail || req.query.userEmail || "").trim();
    if (!userEmail) {
      return res.json({ status: false, message: "userEmail is required" });
    }
    const lookupValue = req.params.productId;
    const updated = await Cart.findOneAndUpdate(
      {
        userEmail,
        $or: [
          { productId: lookupValue },
          {
            _id: mongoose.Types.ObjectId.isValid(lookupValue)
              ? lookupValue
              : null,
          },
        ],
      },
      { $set: { quantity: req.body.quantity } },
      { new: true },
    );
    if (!updated) {
      return res.json({ status: false, message: "Cart item not found" });
    }
    res.json({ status: true, cartItem: updated });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.json({ status: false, message: "Internal server error" });
  }
});

app.delete("/cart/:productId", async (req, res) => {
  try {
    const userEmail = String(req.query.userEmail || "").trim();
    if (!userEmail) {
      return res.json({ status: false, message: "userEmail is required" });
    }
    const lookupValue = req.params.productId;
    const deleted = await Cart.findOneAndDelete({
      userEmail,
      $or: [
        { productId: lookupValue },
        {
          _id: mongoose.Types.ObjectId.isValid(lookupValue)
            ? lookupValue
            : null,
        },
      ],
    });
    if (!deleted) {
      return res.json({ status: false, message: "Cart item not found" });
    }
    res.json({ status: true, message: "Cart item deleted successfully" });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.json({ status: false, message: "Internal server error" });
  }
});

// ==========================================
// WISHLIST ROUTES
// ==========================================
app.get("/wishlist", async (req, res) => {
  try {
    const { userEmail } = req.query;
    const items = await Wishlist.find({ userEmail }).sort({ createdAt: -1 });
    res.json({ status: true, wishlist: items });
  } catch (error) {
    res.json({ status: false });
  }
});

app.post("/wishlist", async (req, res) => {
  try {
    const userEmail = String(req.body.userEmail || "").trim();
    const productId =
      req.body.productId || req.body._id || req.body.productCode;
    if (!userEmail) {
      return res.json({ status: false, message: "userEmail is required" });
    }
    if (!productId) {
      return res.json({ status: false, message: "productId is required" });
    }

    const existing = await Wishlist.findOne({ userEmail, productId });
    if (existing) {
      return res.json({
        status: true,
        message: "Already in wishlist",
        wishlistItem: existing,
      });
    }

    const wishlistItem = await Wishlist.create({
      userEmail,
      productId,
      title: req.body.title,
      weight: req.body.weight,
      category: req.body.category,
      unit: req.body.unit,
      description: req.body.description,
      regularPrice: req.body.regularPrice,
      salePrice: req.body.salePrice,
      stockStatus: req.body.stockStatus,
      productCode: req.body.productCode,
      productSku: req.body.productSku,
      status: req.body.status,
      image: req.body.image,
    });
    res.json({ status: true, message: "Added to wishlist", wishlistItem });
  } catch (error) {
    console.error("Error saving wishlist item:", error);
    res.json({ status: false, message: "Internal server error" });
  }
});

app.delete("/wishlist/:productId", async (req, res) => {
  try {
    const userEmail = String(req.query.userEmail || "").trim();
    if (!userEmail) {
      return res.json({ status: false, message: "userEmail is required" });
    }
    const lookupValue = req.params.productId;
    const deleted = await Wishlist.findOneAndDelete({
      userEmail,
      $or: [
        { productId: lookupValue },
        {
          _id: mongoose.Types.ObjectId.isValid(lookupValue)
            ? lookupValue
            : null,
        },
      ],
    });
    if (!deleted) {
      return res.json({ status: false, message: "Wishlist item not found" });
    }
    res.json({ status: true, message: "Wishlist item deleted successfully" });
  } catch (error) {
    console.error("Error deleting wishlist item:", error);
    res.json({ status: false, message: "Internal server error" });
  }
});

app.post("/removeproduct", async (req, res) => {
  let deletedata = await Products.findByIdAndDelete({ _id: req.body.data._id });
  if (deletedata) {
    res.json({
      status: true,
    });
  } else {
    res.json({
      status: false,
    });
  }
});

app.post("/removecategory", async (req, res) => {
  let deletecategory = await Category.findByIdAndDelete({ _id: req.body.data._id });
    if (deletecategory) {
    res.json({
      status: true,
    });
  } else {
    res.json({
      status: false,
    });
  }
});


app.listen(8080, () => {
  console.log("Server started on port 8080");
});








app.get("/",(req,res)=>{
  res.json({
    status:true
  })
})
