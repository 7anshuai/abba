import mongoose from 'mongoose';
import parser from 'ua-parser-js';

const requestSchema = new mongoose.Schema({
  url: String,
  ip: String,
  user_agent: String,
  browser: String,
  browser_version: String,
  platform: String,
  mobile: {type: Boolean},

  started_request_type: String,
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

requestSchema.methods.request = function(request) {
  this.url = request.get('Referrer');
  this.ip = request.ip;
  this.user_agent = request.headers['user-agent'];

  const ua = parser(this.user_agent);
  this.browser = ua.browser.name;
  this.version = ua.browser.version;
  this.platform = ua.os.name;
  this.mobile = ua.device.type == 'mobile'

  return this
}

const Request = mongoose.model('Request', requestSchema);
export default Request;
