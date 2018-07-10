import assert from 'assert';

import request from 'supertest';
import app from '../src/app.js';
import Experiment from '../src/models/Experiment';
import Variant from '../src/models/Variant';
import Request from '../src/models/Request';

describe('GET /', () => {
  it('should redirect properly', async () => {
    await request(app)
      .get('/')
      .expect(302)
      .then(response => {
        assert.equal(response.headers.location, '/admin/experiments');
      });
  });
});

describe('GET /admin', () => {
  it('should redirect properly', async () => {
    await request(app)
      .get('/admin')
      .expect(302)
      .then(response => {
        assert.equal(response.headers.location, '/admin/experiments');
      });
  });
});

describe('GET /start', () => {
  it('should create a experiment properly', async () => {
    await request(app)
      .get('/start')
      .query({experiment: 'My Checkout', variant: 'Variant 1'})
      .expect('Content-Type', /gif/)
      .expect(200);

    let experiments = await Experiment.find({name: 'My Checkout'});
    let variants = await Variant.find({name: 'Variant 1'});
    let requests = await Request.find();
    assert.equal(experiments.length, 1);
    assert.equal(variants.length, 1);
    assert.equal(requests.length, 1);
    assert.equal(experiments[0].id, variants[0].experiment_id);
    assert.equal(requests[0].started_request_id, variants[0].id);
  });
});

describe('GET /complete', () => {
  it('should complete a experiment properly', async () => {
    await request(app)
      .get('/complete')
      .query({experiment: 'My Checkout', variant: 'Variant 1'})
      .expect('Content-Type', /gif/)
      .expect(200);

    let variant = await Variant.findOne({name: 'Variant 1'});
    let requests = await Request.find();
    assert.equal(requests.length, 2);
    assert.equal(requests[1].completed_request_id, variant.id);
  });
});

describe('GET /admin/experiments', () => {
  it('should render experiments properly', async () => {
    await request(app)
      .get('/admin/experiments')
      .expect(200)
      .then(response => {
        assert.ok(/<title>Abba - Experiments<\/title>/.test(response.text));
      });
  });
});

describe('DELETE /admin/experiment/:id', () => {
  it('should delete a experiment properly', async () => {
    let experiment = await Experiment.findOne({name: 'My Checkout'});
    await request(app)
      .delete(`/admin/experiments/${experiment.id}`)
      .expect(200);

    let experiments = await Experiment.find();
    let variants = await Variant.find();
    let requests = await Request.find();
    assert.equal(experiments.length, 0);
    assert.equal(variants.length, 0);
    assert.equal(requests.length, 0);
  });
});

describe('GET /404', () => {
  it('should return 404 for non-existent URLs', async () => {
    await request(app).get('/404').expect(404);
    await request(app).get('/notfound').expect(404);
  });
});
