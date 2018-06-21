import express from 'express';
import path from 'path';
import logger from 'morgan';
import bodyParser from 'body-parser';
import createError from 'http-errors';
import chalk from 'chalk';
import mongoose from 'mongoose';

import routes from './routes';

const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(connection => {
    console.log('%s Connected to MongoDB', chalk.green('✓'));
  })
  .catch(err => {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
  });

// View engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(logger('dev', {
  skip: () => app.get('env') === 'test'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (req.xhr) return res.json({message: res.locals.message, error: res.locals.error});
  res.render('error');
});

export default app;
