const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Update CORS to allow your future frontend URL
app.use(cors()); 
app.use(express.json());

// 1. DATABASE CONNECTION
// Ensure your MONGO_URI in Render dashboard doesn't have quotes
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.log("❌ Database Connection Error:", err));

// 2. MODELS IMPORT
const Vehicle = require('./models/Vechicle'); 
const Transaction = require('./models/Transaction');
const Plaza = require('./models/Plaza'); 

// --- ROUTES ---

app.get('/', (req, res) => {
  res.send('Toll Management API is Live and Connected!');
});

// B. PLAZA MANAGEMENT
app.post('/api/admin/add-plaza', async (req, res) => {
  try {
    const newPlaza = new Plaza(req.body);
    await newPlaza.save();
    res.status(201).json({ message: "✅ Plaza Added Successfully!", data: newPlaza });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/plazas', async (req, res) => {
  try {
    const plazas = await Plaza.find();
    res.json(plazas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// C. VEHICLE MANAGEMENT
app.post('/api/register', async (req, res) => {
  try {
    const newVehicle = new Vehicle(req.body);
    await newVehicle.save();
    res.status(201).json({ message: "Vehicle Registered!", data: newVehicle });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/vehicle/:vehicleNumber', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ 
        vehicleNumber: { $regex: new RegExp("^" + req.params.vehicleNumber + "$", "i") } 
    });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recharge', async (req, res) => {
  const { vehicleNumber, amount } = req.body;
  try {
    const vehicle = await Vehicle.findOne({ vehicleNumber: new RegExp("^" + vehicleNumber + "$", "i") });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    vehicle.balance += Number(amount);
    await vehicle.save();
    res.json({ message: "Recharge Successful", newBalance: vehicle.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// D. TOLL PROCESSING LOGIC
app.post('/api/toll-entry', async (req, res) => {
  const { vehicleNumber, plazaName } = req.body;
  try {
    const vehicle = await Vehicle.findOne({ vehicleNumber: new RegExp("^" + vehicleNumber + "$", "i") });
    const plaza = await Plaza.findOne({ name: plazaName });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    if (!plaza) return res.status(404).json({ message: "Plaza not found" });

    let tollAmount = 100;
    const type = vehicle.vehicleType.toLowerCase();
    if (type.includes('two')) tollAmount = plaza.rates.twoWheeler;
    else if (type.includes('car')) tollAmount = plaza.rates.car;
    else if (type.includes('truck')) tollAmount = plaza.rates.truck;
    else if (type.includes('bus')) tollAmount = plaza.rates.bus;
    else if (type.includes('heavy')) tollAmount = plaza.rates.heavy;

    if (vehicle.balance < tollAmount) {
      return res.status(400).json({ message: `Insufficient Balance! Need ₹${tollAmount}` });
    }
    vehicle.balance -= tollAmount;
    await vehicle.save();
    plaza.accountBalance += tollAmount;
    await plaza.save();

    const newTxn = new Transaction({
      vehicleNumber: vehicle.vehicleNumber,
      plazaName: plaza.name,
      tollAmount: tollAmount,
      balanceAfter: vehicle.balance
    });
    await newTxn.save();
    res.json({ message: `₹${tollAmount} deducted`, remainingBalance: vehicle.balance, transaction: newTxn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// E. HISTORY
app.get('/api/history/:vehicleNumber', async (req, res) => {
  try {
    const logs = await Transaction.find({ vehicleNumber: new RegExp("^" + req.params.vehicleNumber + "$", "i") }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plaza-history/:plazaName', async (req, res) => {
  try {
    const logs = await Transaction.find({ plazaName: req.params.plazaName }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRITICAL CHANGE FOR DEPLOYMENT:
// Use process.env.PORT because Render will assign a port like 10000 automatically
const PORT = process.env.PORT || 3000; 

app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});
