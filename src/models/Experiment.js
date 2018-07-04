import mongoose from 'mongoose';
import moment from 'moment';

import Variant from './Variant';

const experimentSchema = new mongoose.Schema({
  name: {type: String, required: true},
  running: {type: Boolean, default: true},

  // variants: [{type: mongoose.Schema.Types.ObjectId, ref: 'Variant'}]

}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'abba.experiments'
});

experimentSchema.methods.control = async function() {
  let variants = await Variant.find({experiment_id: this._id}).where({control: true});
  return variants[0];
}

experimentSchema.methods.granularConversionRate = function(options = {}) {
  let rates = [];
  return Variant
    .find({experiment_id: this.id})
    .then(async variants => {
      for (let variant of variants) {
        rates.push({
          name: variant.name,
          values: await variant.granularConversionRate(
            Object.assign({}, {
              start_at: moment(options.start_at),
              end_at: moment(options.end_at),
              tranche: options.tranche
            })
          )
        });
      }
      return rates;
    })
    .catch(err => {
      throw err;
    });
};

const Experiment = mongoose.model('Experiment', experimentSchema);
export default Experiment;
