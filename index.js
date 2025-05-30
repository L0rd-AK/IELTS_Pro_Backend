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

const uri = `mongodb+srv://sanaullahiftasunny:2KPba6JIjGh34vVV@cluster0.4ozfa3t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Test the database connection
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
connectDB();

const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASS
const is_live = false //true for live, false for sandbox

async function run() {
  try {
    const users = client.db("IELTS").collection("users");
    const blogs = client.db("IELTS").collection("blogs");
    const dashboard = client.db("IELTS").collection("dashboard");
    const test_history = client.db("IELTS").collection("test_history");
    const payments = client.db("IELTS").collection("payments");
    
    // =================== crud operations ======================
    
    // ========================user crud=======================
    // Get all users
    app.get("/users", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });
    
    // Get user by email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await users.findOne(query);
      res.send(result);
    });
    
    // Add a new user=
    app.post("/users", async (req, res) => {
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
    });
    
    // Update user
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedUser = req.body;
      const user = {
        $set: updatedUser,
      };
      const result = await users.updateOne(filter, user, options);
      res.send(result);
    });
    
    // Delete user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await users.deleteOne(query);
      res.send(result);
    });
    
    // Check if user is admin-
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await users.findOne(query);
      console.log("hit",email,user);
      let isAdmin = false;
      if (user) {
        isAdmin = (user.role === "admin");
        console.log("hit",email,user);
      }
      res.send({ isAdmin });
    });
    
    // Make user admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await users.updateOne(filter, updatedDoc);
      res.send(result);
    });
    
    // ========================blogs crud=======================
    // Get all blogs
    app.get("/blogs", async (req, res) => {
      const result = await blogs.find().toArray();
      res.send(result);
    });
    
    // Get blog by id
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogs.findOne(query);
      res.send(result);
    });
    
    // Add a new blog
    app.post("/blogs", async (req, res) => {
      const blog = req.body;
      const result = await blogs.insertOne(blog);
      res.send(result);
    });
    
    // Update blog
    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBlog = req.body;
      const blog = {
        $set: updatedBlog,
      };
      const result = await blogs.updateOne(filter, blog, options);
      res.send(result);
    });
    
    // Delete blog
    app.delete("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogs.deleteOne(query);
      res.send(result);
    });
    
    // ========================dashboard crud=======================
    // Get all dashboard data
    app.get("/dashboard", async (req, res) => {
      const result = await dashboard.find().toArray();
      res.send(result);
    });
    
    // Get dashboard data by id
    app.get("/dashboard/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await dashboard.findOne(query);
      res.send(result);
    });
    
    // Add dashboard data
    app.post("/dashboard", async (req, res) => {
      const data = req.body;
      const result = await dashboard.insertOne(data);
      res.send(result);
    });
    
    // Update dashboard data
    app.put("/dashboard/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedData = req.body;
      const data = {
        $set: updatedData,
      };
      const result = await dashboard.updateOne(filter, data, options);
      res.send(result);
    });
    
    // Delete dashboard data
    app.delete("/dashboard/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await dashboard.deleteOne(query);
      res.send(result);
    });
    
    // ========================test_history crud=======================
    // Get all test history
    app.get("/test-history", async (req, res) => {
      const result = await test_history.find().toArray();
      res.send(result);
    });
    
    // Get test history by user email
    app.get("/test-history/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await test_history.find(query).toArray();
      res.send(result);
    });
    
    // Add test history
    app.post("/test-history", async (req, res) => {
      const history = req.body;
      const result = await test_history.insertOne(history);
      res.send(result);
    });
    
    // Update test history
    app.put("/test-history/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedHistory = req.body;
      const history = {
        $set: updatedHistory,
      };
      const result = await test_history.updateOne(filter, history, options);
      res.send(result);
    });
    
    // Delete test history
    app.delete("/test-history/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await test_history.deleteOne(query);
      res.send(result);
    });
    
    // Admin routes for test history
    app.get("/admin/test-history", async (req, res) => {
      const result = await test_history.find().toArray();
      res.send(result);
    });
    
    // ========================Payment Routes=======================
    app.post('/create-payment', async(req, res) =>{
      const payment = req.body;
      const paymentId = new ObjectId().toString();
      
      const data = {
        total_amount: payment.amount,
        currency: 'BDT',
        tran_id: paymentId, // use unique tran_id for each transaction
        success_url: `http://localhost:5000/payment/success/${paymentId}`,
        fail_url: `http://localhost:5000/payment/fail/${paymentId}`,
        cancel_url: `http://localhost:5000/payment/cancel/${paymentId}`,
        ipn_url: 'http://localhost:5000/ipn',
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
    });

    // Payment success route
    app.post("/payment/success/:tranId", async (req, res) => {
      const result = await payments.updateOne(
        { transactionId: req.params.tranId },
        {
          $set: {
            status: 'success',
            paidAt: new Date()
          }
        }
      );
      
      res.redirect(`http://localhost:9002/payment/success/${req.params.tranId}`);
    });

    // Payment fail route
    app.post("/payment/fail/:tranId", async (req, res) => {
      const result = await payments.updateOne(
        { transactionId: req.params.tranId },
        {
          $set: {
            status: 'failed'
          }
        }
      );
      
      res.redirect(`http://localhost:9002/payment/fail/${req.params.tranId}`);
    });

    // Get payment status
    app.get("/payment/:tranId", async (req, res) => {
      const payment = await payments.findOne(
        { transactionId: req.params.tranId }
      );
      res.send(payment);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    //
  }
}
run().catch(console.dir);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.get("/", (req, res) => {
  res.send("IELTS Pro Backend is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});