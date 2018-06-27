import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  url: String,
  ip: String,
  user_agent: String,
  browser: String,
  browser_version: String,
  platform: String,
  mobile: {type: Boolean},

  started_request_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Variant'},
  completed_request_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Variant'}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'abba.requests'
});

requestSchema.statics.TRANCHES = {
  chrome:  {browser: 'Chrome'},
  safari:  {browser: 'Safari'},
  firefox: {browser: 'Firefox'},
  ie:      {browser: 'Internet Explorer'},
  ie6:     {browser: 'Internet Explorer', browser_version: '6.0'},
  ie7:     {browser: 'Internet Explorer', browser_version: '7.0'},
  ie8:     {browser: 'Internet Explorer', browser_version: '8.0'},
  ie9:     {browser: 'Internet Explorer', browser_version: '9.0'},
  ie10:    {browser: 'Internet Explorer', browser_version: '10.0'},
  ie11:    {browser: 'Internet Explorer', browser_version: '11.0'},
  mobile:  {mobile: true}
}

const Request = mongoose.model('Request', requestSchema);
export default Request;
