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
  if (!variant) variant = await Variant.createOne({name: req.query.variant, experiment_id: experiment.id});

  if (experiment.running) await variant.start(req);
  res.sendFile('/public/images/blank.gif');

});

export default routes;