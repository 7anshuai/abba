import { Router } from 'express';
import createError from 'http-errors';

import Experiment from '../models/Experiment';
import Variant from '../models/Variant';

const routes = Router();

/**
 * Set helper methods
 */
routes.use(function(req, res, next) {
  res.locals.setTitle = function(value = null) {
    let title;
    if (value)
      title = value;
    return title ? `Abba - ${title}` : 'Abba';
  }
  res.locals.selected = function(value, present) {
    if (value === present) return ' selected '
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
      console.error(err);
      next(err);
    });
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
    .then(experiment => {
      if (!experiment) return res.redirect('/admin/experiments');
      Variant
        .find({experiment_id: experiment.id})
        .then(variants => {
          res.render('experiment', {title: `${experiment.name}`, experiment, variants, tranche: ''});
        });
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
});

export default routes;
