import range from 'lodash.range';

import Request from './Request';
import Variant from './Variant';

let Z_TO_PROBABILITY;
try {
  let a = 50.0;
  let normDist = [];

  for (let x of range(0.0, 3.11, 0.01)) {
    normDist.push([x, a += 1 / Math.sqrt(2 * Math.PI) * Math.E ** -(x ** 2 / 2)]);
  }
  Z_TO_PROBABILITY = [90, 95, 99, 99.9].map(pct => [normDist.find(([x, a]) => a >= pct)[0], pct]).reverse();
} catch (err) {
  throw err;
}

export default class VariantPresentor {
  constructor(variant, control = null, options = {}) {
    this.variant = variant;
    this.control = control;
    this.options = options;
  }

  async startedCount() {
    this.started_count = this.started_count || (await this._startedRequests()).length;
    return this.started_count;
  }

  async completedCount() {
    this.completed_count = this.completed_count || (await this._completedRequests()).length;
    return this.completed_count;
  }

  async conversionRate() {
    let startedCount = await this.startedCount();
    let completedCount = await this.completedCount();
    if (startedCount == 0) return 0;
    return completedCount / startedCount;
  }

  async percentConversionRate() {
    return Math.fround((await this.conversionRate()) * 100);
  }

  async percentDifference() {
    if (this.isControl() || !this.control) return;

    let conversionRate = await this.conversionRate();
    let controlConversionRate = await this.control.conversionRate();

    if (controlConversionRate == 0) return 0;
    let rate = (conversionRate - controlConversionRate) / controlConversionRate;
    return Math.fround(rate * 100);
  }

  async probability() {
    if (await this.completedCount() < 25) return;

    let score = await this.zscore();
    score = Math.abs(score);
    if (!score) return;

    let probability = Z_TO_PROBABILITY.find(([z, p]) => score >= z)
    return probability && probability.length ? probability[probability.length - 1] : 0;
  }

  id() {
    return this.variant.id;
  }

  name() {
    return this.variant.name;
  }

  isControl() {
    return this.variant.control;
  }

  _startedRequests() {
    let query = Request.find({started_request_id: this.variant.id});

    if (this.options.start_at && this.options.end_at) {
      query.where({'created_at': {$gte: this.options.start_at, $lte: this.options.end_at}});
    }

    if (this.options.tranche) {
      query.where(Request.TRANCHES[this.options.tranche] || {});
    }
    return query.exec();
  }

  _completedRequests() {
    let query = Request.find({completed_request_id: this.variant.id});

    if (this.options.start_at && this.options.end_at) {
      query.where({'created_at': {$gte: this.options.start_at, $lte: this.options.end_at}});
    }

    if (this.options.tranche) {
      query.where(Request.TRANCHES[this.options.tranche] || {});
    }

    return query.exec();
  }

  async zscore() {
    if (this.isControl() || !this.control) return;

    let pc = await this.control.conversionRate();
    let nc = await this.control.startedCount();
    let p = await this.conversionRate();
    let n = await this.startedCount();

    if (nc == 0 || n == 0) return;
    return (p - pc) /  Math.abs(((p * (1 - p) / n ) + (pc * (1 - pc) / nc))) ** 0.5;
  }
}

export class VariantPresentorGroup {
  constructor(experiment, options = {}) {
    this.experiment = experiment;
    this.options = options;
  }

  async init() {
    this.control = await this.experiment.control();
    if (this.control)
      this.control = new VariantPresentor(this.control, null, this.options);
    this.variants = await Variant.find({experiment_id: this.experiment.id});
  }

  each() {
    return this.variants.map(variant => {
      return new VariantPresentor(variant, this.control, this.options);
    });
  }
}
