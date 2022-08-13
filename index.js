const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const stripe = require("stripe")(
  "sk_test_51LTICYSFeh1O7ioUYHISJyYsn9fmVgGZ5GqTOVg8ZqOAJCS6ubMvU4md0mdGGoWXhgK4IrPVi24TzrfjtlLTmKwK00skgjBLjL"
);
const uri =
  "mongodb+srv://ammar_ranapur:ammar104@cluster0.85txa.mongodb.net/?retryWrites=true&w=majority";
// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
mongoose.connect(uri, { dbName: "amazon-clone" });
const orderSchema = mongoose.Schema({
  basket: [
    {
      id: String,
      title: String,
      image: String,
      price: Number,
      rating: Number,
    },
  ],
  amount: Number,
  created: Number,
});

const userSchema = mongoose.Schema({
  email: String,
  orders: [orderSchema],
});
const User = mongoose.model("Users", userSchema);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

async function findAndUpdate(body) {
  const doc = await User.findOne({ email: body.email });
  const order = {
    basket: body.basket,
    amount: body.amount,
    created: body.created,
  };
  if (doc) {
    doc.orders.unshift(order);
    doc.save();
  } else {
    var my_orders = [order];
    User.create({ email: body.email, orders: my_orders }, (err) => {
      if (err) console.log(err);
    });
  }
}
async function getOrders(email) {
  return await User.findOne({ email: email });
}
app.post("/orders", (req, res) => {
  console.log(req.body);
  findAndUpdate(req.body);
});
app.get("/orders/:email", (req, res) => {
  getOrders(req.params.email).then((result) => {
    res.send(result.orders);
  });
});

app.get("/", (req, res) => res.status(200).send("Hello world"));

app.post("/payments/create", async (req, res) => {
  const total = req.query.total;
  console.log("payment request received for:", total);
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "inr",
    });
    res.status(201).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.log(err);
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("server is running on port 3001...");
});
