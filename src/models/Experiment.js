import mongoose from 'mongoose';

const experimentSchema = new mongoose.Schema({
  name: String,
  running: {type: Boolean, default: true},

  variants: [{type: mongoose.Schema.Types.ObjectId, ref: 'Variant'}]

}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'abba.experiments'
});

experimentSchema.methods.granularConversionRate = function(options = {}) {

};

const Experiment = mongoose.model('Experiment', experimentSchema);

export default Experiment;
