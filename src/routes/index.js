import { Router } from 'express';

import Experiment from '../models/Experiment';
import Variant from '../models/Variant';

const routes = Router();

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
          res.render('experiments', { title: 'Abba - Experiments',  host: req.get('host'), experiments, variants });
        });
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
});

export default routes;
