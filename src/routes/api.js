import createDebug from 'debug';
import { Router } from 'express';
import { check, validationResult } from 'express-validator/check';

import Experiment from '../models/Experiment';
import Variant from '../models/Variant';

const debug = createDebug('abba:api');
const routes = Router();

/**
 * GET /api/start
 */
routes.get('/start', check(['experiment', 'variant']).exists(), async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({errros: errors.array()});

  let experiment = await Experiment.findOne({name: req.query.experiment});
  if (!experiment) experiment = await Experiment.createOne({name: req.query.experiment});

  let variant = await Variant.findOne({name: req.query.variant, experiment_id: experiment.id});
  if (!variant) variant = await Variant.create({name: req.query.variant, experiment_id: experiment.id});

  if (experiment.running) await variant.start(req);
  res.sendFile('public/images/blank.gif', {root: process.cwd()});

});

/**
 * GET /api/complete
 */
routes.get('/complete', check(['experiment', 'variant']).exists(), async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({errros: errors.array()});

  let experiment = await Experiment.findOne({name: req.query.experiment});
  let variant = await Variant.findOne({name: req.query.variant, experiment_id: experiment.id});

  if (variant && experiment && experiment.running) await variant.complete(req);

  res.sendFile('public/images/blank.gif', {root: process.cwd()});
});

export default routes;