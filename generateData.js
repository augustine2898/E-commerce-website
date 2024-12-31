const { faker } = require('@faker-js/faker');  // Correct way to import in newer versions
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Order = require('./models/orderSchema'); // Ensure the path is correct

// Connect to MongoDB
const dbURL = 'mongodb://localhost:27017/nodewebapp'; // Change to your MongoDB URL
mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

function generateFakeOrderData() {
  const orderItems = [];
  const numItems = faker.number.int({ min: 1, max: 5 });  // Updated method for random number

  for (let i = 0; i < numItems; i++) {
    orderItems.push({
      product: { $oid: uuidv4() },
      quantity: faker.number.int({ min: 1, max: 10 }),  // Updated method
      price: parseFloat(faker.commerce.price(100, 10000, 0)),
      appliedDiscount: parseFloat(faker.commerce.price(0, 5000, 0)),
      discountType: faker.helpers.arrayElement(['Product Offer', 'Category Offer', 'None']),
      _id: { $oid: uuidv4() },
    });
  }

  const totalPrice = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const offerDiscount = orderItems.reduce((total, item) => total + item.appliedDiscount, 0);
  const couponDiscount = faker.number.int({ min: 0, max: 2000 });  // Updated method
  const discount = offerDiscount + couponDiscount;
  const finalAmount = totalPrice - discount;

  return {
    orderItems,
    totalPrice,
    offerDiscount,
    couponDiscount,
    discount,
    finalAmount,
    address: { $oid: uuidv4() },
    user: { $oid: uuidv4() },
    invoiceDate: { $date: faker.date.past().toISOString() },
    status: faker.helpers.arrayElement(['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled', 'Return Requested', 'Returned']),
    statusDates: {
      Pending: { $date: new Date().toISOString() },
      Processing: { $date: faker.date.recent().toISOString() },
      Shipped: { $date: faker.date.recent().toISOString() },
      Delivered: { $date: faker.date.recent().toISOString() },
      Canceled: { $date: faker.date.recent().toISOString() },
      Return_Requested: { $date: faker.date.recent().toISOString() },
      Returned: { $date: faker.date.recent().toISOString() },
      Return_Requested_canceled: { $date: faker.date.recent().toISOString() },
    },
    couponApplied: faker.datatype.boolean(),
    couponCode: faker.datatype.string(8),  // Correct method for generating alphanumeric strings
    paymentMethod: faker.helpers.arrayElement(['COD', 'Razorpay']),
    orderId: uuidv4(),
    createdOn: { $date: new Date().toISOString() },
    __v: 0,
  };
}

async function saveFakeOrderData() {
  try {
    const fakeOrderData = generateFakeOrderData();

    // Save the generated fake order data to MongoDB
    const order = new Order(fakeOrderData);
    await order.save();

    console.log('Fake order data has been saved to MongoDB');
  } catch (error) {
    console.error('Error saving order data:', error);
  } finally {
    mongoose.connection.close(); // Close the connection after saving data
  }
}

saveFakeOrderData();
