const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const SSLCommerzPayment = require('sslcommerz-lts')

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

// Create a MongoClient. The driver connects lazily on first operation, so we do
// NOT call client.connect() at load time. The client is created once per
// container and reused across warm serverless invocations.
//
// If MONGODB_URI is missing we must NOT construct the client or process.exit():
// either would throw at import and turn into FUNCTION_INVOCATION_FAILED on Vercel.
// Instead we leave the collections undefined and let requests fail cleanly (500).
let client, db, users, blogs, dashboard, test_history, payments;
if (uri) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  db = client.db("IELTS");
  users = db.collection("users");
  blogs = db.collection("blogs");
  dashboard = db.collection("dashboard");
  test_history = db.collection("test_history");
  payments = db.collection("payments");
} else {
  console.error("Missing MONGODB_URI environment variable. Set it in the Vercel project env.");
}

// Reject DB requests with a clear message when the connection was never configured.
app.use((req, res, next) => {
  if (!uri && req.path !== "/") {
    return res.status(500).send("Server misconfigured: MONGODB_URI is not set.");
  }
  next();
});

const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASS
const is_live = process.env.IS_LIVE === 'true' //true for live, false for sandbox

// Base URLs (override in production via env)
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${port}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9002';

// Wrap async handlers so a rejected promise becomes a 500 instead of a hung
// request / crashed function (Express 4 does not catch async errors).
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// =================== crud operations ======================

// ========================user crud=======================
// Get all users
app.get("/users", wrap(async (req, res) => {
  const result = await users.find().toArray();
  res.send(result);
}));

// Get user by email
app.get("/user/:email", wrap(async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const result = await users.findOne(query);
  res.send(result);
}));

// Add a new user=
app.post("/users", wrap(async (req, res) => {
  const user = req.body;
  console.log(user);
  // Check if user already exists
  const query = { email: user.email };
  const existingUser = await users.findOne(query);
  if (existingUser) {
    return res.send({ message: "User already exists", insertedId: null });
  }
  const result = await users.insertOne(user);
  res.send(result);
}));

// Update user
app.put("/users/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedUser = req.body;
  const user = {
    $set: updatedUser,
  };
  const result = await users.updateOne(filter, user, options);
  res.send(result);
}));

// Delete user
app.delete("/users/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await users.deleteOne(query);
  res.send(result);
}));

// Check if user is admin-
app.get("/users/admin/:email", wrap(async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await users.findOne(query);
  console.log("hit", email, user);
  let isAdmin = false;
  if (user) {
    isAdmin = (user.role === "admin");
    console.log("hit", email, user);
  }
  res.send({ isAdmin });
}));

// Make user admin
app.patch("/users/admin/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      role: "admin",
    },
  };
  const result = await users.updateOne(filter, updatedDoc);
  res.send(result);
}));

// ========================blogs crud=======================
// Get all blogs
app.get("/blogs", wrap(async (req, res) => {
  const result = await blogs.find().toArray();
  res.send(result);
}));

// Get blog by id
app.get("/blogs/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await blogs.findOne(query);
  res.send(result);
}));

// Add a new blog
app.post("/blogs", wrap(async (req, res) => {
  const blog = req.body;
  const result = await blogs.insertOne(blog);
  res.send(result);
}));

// Update blog
app.put("/blogs/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedBlog = req.body;
  const blog = {
    $set: updatedBlog,
  };
  const result = await blogs.updateOne(filter, blog, options);
  res.send(result);
}));

// Delete blog
app.delete("/blogs/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await blogs.deleteOne(query);
  res.send(result);
}));

// ========================dashboard crud=======================
// Get all dashboard data
app.get("/dashboard", wrap(async (req, res) => {
  const result = await dashboard.find().toArray();
  res.send(result);
}));

// Get dashboard data by id
app.get("/dashboard/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await dashboard.findOne(query);
  res.send(result);
}));

// Add dashboard data
app.post("/dashboard", wrap(async (req, res) => {
  const data = req.body;
  const result = await dashboard.insertOne(data);
  res.send(result);
}));

// Update dashboard data
app.put("/dashboard/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedData = req.body;
  const data = {
    $set: updatedData,
  };
  const result = await dashboard.updateOne(filter, data, options);
  res.send(result);
}));

// Delete dashboard data
app.delete("/dashboard/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await dashboard.deleteOne(query);
  res.send(result);
}));

// ========================test_history crud=======================
// Get all test history
app.get("/test-history", wrap(async (req, res) => {
  const result = await test_history.find().toArray();
  res.send(result);
}));

// Get test history by user email
app.get("/test-history/:email", wrap(async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const result = await test_history.find(query).toArray();
  res.send(result);
}));

// Add test history
app.post("/test-history", wrap(async (req, res) => {
  const history = req.body;
  const result = await test_history.insertOne(history);
  res.send(result);
}));

// Update test history
app.put("/test-history/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedHistory = req.body;
  const history = {
    $set: updatedHistory,
  };
  const result = await test_history.updateOne(filter, history, options);
  res.send(result);
}));

// Delete test history
app.delete("/test-history/:id", wrap(async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await test_history.deleteOne(query);
  res.send(result);
}));

// Admin routes for test history
app.get("/admin/test-history", wrap(async (req, res) => {
  const result = await test_history.find().toArray();
  res.send(result);
}));

// ========================Payment Routes=======================
app.post('/create-payment', wrap(async (req, res) => {
  const payment = req.body;
  const paymentId = new ObjectId().toString();

  const data = {
    total_amount: payment.amount,
    currency: 'BDT',
    tran_id: paymentId, // use unique tran_id for each transaction
    success_url: `${BACKEND_URL}/payment/success/${paymentId}`,
    fail_url: `${BACKEND_URL}/payment/fail/${paymentId}`,
    cancel_url: `${BACKEND_URL}/payment/cancel/${paymentId}`,
    ipn_url: `${BACKEND_URL}/ipn`,
    shipping_method: 'NA',
    product_name: payment.packageName,
    product_category: 'Education',
    product_profile: 'IELTS Course',
    cus_name: payment.name,
    cus_email: payment.email,
    cus_add1: payment.address || 'NA',
    cus_phone: payment.phone || 'NA',
    ship_name: 'NA',
    ship_add1: 'NA',
    ship_city: 'NA',
    ship_postcode: 'NA',
    ship_country: 'NA',
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
  const apiResponse = await sslcz.init(data);

  // Store payment info in database
  const paymentInfo = {
    ...payment,
    paymentId,
    transactionId: paymentId,
    status: 'pending',
    createdAt: new Date()
  }
  const result = await payments.insertOne(paymentInfo);

  res.send({ url: apiResponse.GatewayPageURL });
}));

// Payment success route
app.post("/payment/success/:tranId", wrap(async (req, res) => {
  const result = await payments.updateOne(
    { transactionId: req.params.tranId },
    {
      $set: {
        status: 'success',
        paidAt: new Date()
      }
    }
  );

  res.redirect(`${FRONTEND_URL}/payment/success/${req.params.tranId}`);
}));

// Payment fail route
app.post("/payment/fail/:tranId", wrap(async (req, res) => {
  const result = await payments.updateOne(
    { transactionId: req.params.tranId },
    {
      $set: {
        status: 'failed'
      }
    }
  );

  res.redirect(`${FRONTEND_URL}/payment/fail/${req.params.tranId}`);
}));

// Get payment status
app.get("/payment/:tranId", wrap(async (req, res) => {
  const payment = await payments.findOne(
    { transactionId: req.params.tranId }
  );
  res.send(payment);
}));

app.get("/", (req, res) => {
  res.send("IELTS Pro Backend is running");
});

// Global error handler (must be registered after the routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Only bind a port when run directly (local dev). On Vercel the platform
// imports `app` as the request handler and app.listen() must not run.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// Export the Express app so @vercel/node can use it as the serverless handler.
module.exports = app;
