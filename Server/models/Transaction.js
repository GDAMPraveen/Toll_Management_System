const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true },
  plazaName: { type: String, default: "NH-44 Bangalore Toll Plaza" }, // Added Plaza Name
  tollAmount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true }, // Store balance at that time
  timestamp: { type: Date, default: Date.now } // Automatically saves date/time
});

module.exports = mongoose.model('Transaction', TransactionSchema);
