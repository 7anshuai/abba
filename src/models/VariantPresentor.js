import Request from './Request';
import Variant from './Variant';

export default class VariantPresentor {
  constructor(variant, control = null, options = {}) {
    this.variant = variant;
    this.control = control;
    this.options = options;
  }

  async startedCount() {
    this.started_count = this.started_count || (await this.startedRequests());
    return this.started_count;
  }

  async completedCount() {
    this.completed_count = this.completed_count || (await this.completedRequests());
    return this.completed_count;
  }

  async conversionRate() {
    let startedCount = await this.startedCount();
    let completedCount = await this.completedCount();
    if (startedCount.length == 0) return 0;
    return completedCount.length / startedCount.length;
  }

  async percentConversionRate() {
    return Math.fround((await this.conversionRate()) * 100);
  }

  async percentDifference() {
    if (this._control() || !this.control) return;
    if (await this.control.conversionRate() == 0) return 0;
    let conversionRate = await this.conversionRate();
    let controlConversionRate = await this.control.conversionRate();
    let rate = (conversionRate - controlConversionRate) / controlConversionRate;
    return Math.fround(rate * 100);
  }

  id() {
    return this.variant.id;
  }

  name() {
    return this.variant.name;
  }

  _control() {
    return this.variant.control;
  }

  startedRequests() {
    let query = Request.find({started_request_id: this.variant.id});

    if (this.options.start_at && this.options.end_at) {
      query.where({'created_at': {$gte: this.options.start_at, $lte: this.options.end_at}});
    }

    if (this.options.tranche) {
      query.where(Request.TRANCHES[this.options.tranche] || {});
    }
    return query.exec();
  }

  completedRequests() {
    let query = Request.find({completed_request_id: this.variant.id});

    if (this.options.start_at && this.options.end_at) {
      query.where({'created_at': {$gte: this.options.start_at, $lte: this.options.end_at}});
    }

    if (this.options.tranche) {
      query.where(Request.TRANCHES[this.options.tranche] || {});
    }

    return query.exec();
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
