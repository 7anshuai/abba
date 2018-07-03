import mongoose from 'mongoose';
import moment from 'moment';

import Request from './Request';
import VariantPresentor from './VariantPresentor';

const variantSchema = new mongoose.Schema({
  name: {type: String, required: true},
  control: {type: Boolean, default: false},
  started_count: {type: Number, default: 0},
  completed_count: {type: Number, default: 0},

  // started_requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}],
  // completed_requests: [{type: mongoose.Schema.Types.ObjectId, ref: 'Request'}],

  experiment_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Experiment'}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'abba.variants'
});

variantSchema.methods.start = function(req) {
  this.started_count += 1;
  return this
    .save()
    .then(() => {
      return Request
        .create({
          started_request_id: this.id,
          completed_request_id: null,
          started_request_type: 'Abba::Variant'
        })
        .then(request => {
          request.request(req);
          return request.save();
        })
        .catch(err => {
          throw err;
        });
  }).catch(err => {
    throw err;
  });
}

variantSchema.methods.complete = function(req) {
  this.completed_count += 1;
  return this
    .save()
    .then(() => {
      return Request
        .create({
          started_request_id: null,
          completed_request_id: this.id,
          completed_request_type: 'Abba::Variant'
        })
        .then(request => {
          request.request(req);
          return request.save();
        })
        .catch(err => {
          throw err;
        });
    })
    .catch(err => {
      throw err;
    });
}

variantSchema.methods.conversionRateFor = async function(options = {}) {
  let variantPresentor = new VariantPresentor(this, null, options);
  return await variantPresentor.conversionRate();
}

variantSchema.methods.granularConversionRate = async function(options = {}) {
  let {
    duration = 1,
    start_at = moment().add(-7, 'days'),
    end_at = momemt()
  } = options;
  let results = [];

  while (moment.min(start_at, end_at) == start_at) {
    let rate = await this.conversionRateFor(
        Object.assign({}, options, {start_at, end_at: moment(start_at).add(duration, 'days')})
      );
    results.push({time: moment(start_at), rate});
    start_at.add(duration, 'days');
  }

  return results;
}

const Variant = mongoose.model('Variant', variantSchema);
export default Variant;
