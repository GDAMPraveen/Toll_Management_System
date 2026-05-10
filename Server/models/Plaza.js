const mongoose = require('mongoose');

const PlazaSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: String,
  state: String,
  // This tracks the total money currently held by the toll plaza
  accountBalance: { type: Number, default: 0 }, 
  rates: {
    twoWheeler: { type: Number, default: 20 },
    car: { type: Number, default: 60 },
    truck: { type: Number, default: 90 },
    bus: { type: Number, default: 150 },
    heavy: { type: Number, default: 150 }
  }
});

module.exports = mongoose.model('Plaza', PlazaSchema);
