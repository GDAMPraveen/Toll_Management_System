const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true },
  ownerName: String,
  vehicleType: String, // Car, Truck, etc.
  balance: { type: Number, default: 0 },
  tagId: { type: String, unique: true }
});

module.exports = mongoose.model('Vechicle', VehicleSchema);
