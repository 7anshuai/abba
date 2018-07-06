import { timingSafeEqual } from 'crypto';

import auth from 'basic-auth'
import { Router } from 'express';
import { check, validationResult } from 'express-validator/check';
import createDebug from 'debug';
import createError from 'http-errors';
import moment from 'moment';

import Experiment from '../models/Experiment';
import Request from '../models/Request';
import Variant from '../models/Variant';
import { VariantPresentorGroup } from '../models/VariantPresentor';

const routes = Router();
const debug = createDebug('abba:routes');

/**
 * Set helper methods
 */
routes.use(function(req, res, next) {
  res.locals.dir = function(value) {
    if (!value || value == 0) return;
    return value > 0 ? 'positive' : 'negative';
  }
  res.locals.setTitle = function(value = null) {
    let title;
    if (value)
      title = value;
    return title ? `Abba - ${title}` : 'Abba';
  }
  res.locals.selected = function(value, present) {
    if (value === present) return ' selected '
  }
  res.locals.precisionRound = function (number, precision) {
    let factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  }
  next();
});

/**
 * HTTP Basic Auth
 */
routes.get('/admin/*', (req, res, next) => {
  if (req.app.get('env') !== 'production') return next();

  let credentials = auth(req);
  if (!credentials || !authorized(credentials.name, credentials.pass)) {
    return res.append('WWW-Authenticate', 'Basic realm="Abba HTTP Auth"').status(401).end('Not authorized\n');
  }
  next();
});

/**
 * Redirect to /admin/experiments
 */
routes.get('/', (req, res) => {
  res.redirect('/admin/experiments');
});

routes.get('/admin', (req, res) => {
  res.redirect('/admin/experiments');
});

/**
 * GET /admin/experiments
 */
routes.get('/admin/experiments', (req, res, next) => {
  Experiment
    .find({})
    // .populate('variants')
    .then(experiments => {
      let variants = [];
      if (experiments.length) {
        for (let experiment of experiments) {
          variants.push(Variant.find({experiment_id: experiment.id}).exec());
        }
      }
      Promise
        .all(variants)
        .then(variants => {
          experiments = experiments.map((experiment, index) => {
            experiment.variants = variants[index];
            return experiment;
          });
          res.render('experiments', { title: 'Experiments',  host: req.get('host'), experiments });
        });
    })
    .catch(err => {
      debug(err);
      next(err);
    });
});

/**
 * GET /admin/experiments/:id/chart
 */
routes.get('/admin/experiments/:id/chart', check(['start_at', 'end_at']).exists(), (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({errros: errors.array()});

  let {start_at, end_at, tranche} = req.query;

  Experiment
    .findById(req.params.id)
    .then(async experiment => {
      start_at = moment(start_at).startOf('day');
      end_at = moment(end_at).endOf('day');

      let rates = await experiment.granularConversionRate({
        start_at,
        end_at,
        tranche
      });
      res.json(rates);

    })
    .catch(err => {
      debug(err);
      next(err);
    })
});

/**
 * PUT /admin/experiments/:id/toggle
 */
routes.put('/admin/experiments/:id/toggle', (req, res, next) => {
  Experiment
    .findById(req.params.id)
    .then(experiment => {
      if (!experiment) return next(createError(404));
      experiment.running = !experiment.running;
      experiment
        .save()
        .then(() => {
          res.json({});
        })
        .catch(err => {
          next(err);
        });
    }).catch(err => {
      next(err);
    });
});

/**
 * GET /admin/experiments/:id
 */
routes.get('/admin/experiments/:id', (req, res, next) => {
  Experiment
    .findById(req.params.id)
    .then(async experiment => {
      if (!experiment) return res.redirect('/admin/experiments');

      let {start_at, end_at, tranche} = req.query;
      start_at = start_at ? moment(start_at) : moment().max(experiment.created_at, moment().add(-30, 'days'));
      end_at = end_at ? moment(end_at) : moment().utc();

      start_at = start_at.startOf('day');
      end_at = end_at.endOf('day');

      let params = {
        start_at: start_at.format('YYYY-MM-DD'),
        end_at: end_at.format('YYYY-MM-DD'),
        tranche
      };

      let variantPresentorGroup = new VariantPresentorGroup(experiment, {
        start_at,
        end_at,
        tranche
      });
      await variantPresentorGroup.init();

      let variantPresentors = variantPresentorGroup.each();
      let variants = [];

      for (let variantPresentor of variantPresentors) {
        let name = variantPresentor.name();
        let startedCount = await variantPresentor.startedCount();
        let completedCount = await variantPresentor.completedCount();
        let percentConversionRate = await variantPresentor.percentConversionRate();
        let percentDifference = await variantPresentor.percentDifference();
        variants.push({name, startedCount, completedCount, percentConversionRate, percentDifference});
      }

      res.render('experiment', {
        title: `${experiment.name}`,
        experiment,
        variants: variants.sort(function(a, b) { return b.percentConversionRate - a.percentConversionRate}),
        start_at,
        end_at,
        tranche,
        params
      });
    })
    .catch(err => {
      debug(err);
      next(err);
    });
});

/**
 * DELETE /admin/experiments/:id
 */
routes.delete('/admin/experiments/:id', async (req, res, next) => {
  let experiment = await Experiment.findOne({_id: req.params.id});
  if (!experiment) return res.json({});

  let variants = await Variant.find({experiment_id: req.params.id});

  if (variants && variants.length) {
    // delete variants and requests in parallel
    const deleteMany = variants.map(async variant => {
      await Request.deleteMany({$or: [{started_request_id: variant.id}, {completed_request_id: variant.id}]});
      return variant.remove();
    });

    for (let deleteOne of deleteMany) {
      try {
        await deleteOne;
      } catch (err) {
        return next(err);
      }
    }
  }

  // remove this experiment
  try {
    await experiment.remove();
  } catch (err) {
    return next(err);
  }

  res.json({});
});

function authorized(name, pass) {
  let valid = true;
  let {USERNAME, PASSWORD} = process.env;

  if (name.length !== USERNAME.length || pass.length !== PASSWORD.length) return false;

  valid = timingSafeEqual(Buffer.from(name), Buffer.from(USERNAME)) && valid;
  valid = timingSafeEqual(Buffer.from(pass), Buffer.from(PASSWORD)) && valid;
  return valid;
}

export default routes;
