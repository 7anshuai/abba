import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: String,
  control: {type: Boolean, default: false},
  started_count: {type: Number, default: 0},
  completed_count: {type: Number, default: 0},

  started_requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}],
  completed_requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}],

  experiment_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Experiment'}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'abba.variants'
});

const Variant = mongoose.model('Variant', variantSchema);
export default Variant;
