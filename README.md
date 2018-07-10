# abba [![Build Status](https://travis-ci.org/7anshuai/abba.svg?branch=master)](https://travis-ci.org/7anshuai/abba)

abba is a simple a/b testing framework for JavaScript and Node.js.

It's a node.js clone with small improvement over [@maccman](https://github.com/maccman)'s [Abba](https://github.com/maccman/abba).

### Features

- Simple JavaScript API
- Multi variant support
- Filter results by date and browser

### Requirements

- Node.js 6+
- MongoDB

## Getting started

```sh
# Clone the project
git clone https://github.com/7anshuai/abba
cd abba

# Install dependencies
npm install

# or if you're using Yarn
yarn
```
Then you can begin development:

```sh
# yarn
yarn run dev

# npm
npm run dev
```

This will launch a [nodemon](https://nodemon.io/) process for automatic server restarts when your code changes.

### Testing

Testing is powered by [Mocha](https://mochajs.org/). This project also uses [supertest](https://github.com/visionmedia/supertest) for demonstrating a simple routing smoke test suite.

Start the test runner with:

```sh
# yarn
yarn test

# npm
npm test
```

You can also generate coverage with:

```sh
# yarn
yarn run cover

# npm
npm run cover
```

### Linting

Linting is set up using [ESLint](http://eslint.org/). It uses ESLint's default [eslint:recommended](https://github.com/eslint/eslint/blob/master/conf/eslint.json) rules.

Begin linting in watch mode with:

```sh
# yarn
yarn run lint

# npm
npm run lint
```

### Environmental variables in development

The project uses [dotenv](https://www.npmjs.com/package/dotenv) for setting environmental variables during development. Simply copy `.env.example`, rename it to `.env` and add your env vars as you see fit. 

It is **strongly** recommended **never** to check in your .env file to version control. It should only include environment-specific values such as database passwords or API keys used in development. Your production env variables should be different and be set differently depending on your hosting solution. `dotenv` is only for development.

### Using docker in development

You will need docker and docker-compose installed to build the application.

- [Docker installation](https://docs.docker.com/engine/installation/)

- [Common problems setting up docker](https://docs.docker.com/toolbox/faqs/troubleshoot/)

After installing docker, start the application with the following commands:

```
# To build the project for the first time or when you add dependencies
$ docker-compose build web

# To start the application (or to restart after making changes to the source code)
$ docker-compose up web
```

To view the app, find your docker ip address + port 8080 ( this will typically be http://192.168.99.100:8080/ ).

### Deployment

Deployment is specific to hosting platform/provider but generally:

```sh
# yarn
yarn run build

# npm
npm run build
```

will compile your `src` into `/dist`, and 

```sh
# yarn
yarn start

# npm
npm start
```

will run `build` (via the `prestart` hook) and start the compiled application from the `/dist` folder.

The last command is generally what most hosting providers use to start your application when deployed, so it should take care of everything.

## A/B Testing API

First include abba.js using a script tag. The host of this url will need to point to wherever you deployed the app.

```html
<script src="//localhost:8080/scripts/abba.js"></script>
```

Then call `Abba()`, passing in a test name and set up the control test and variants.

```html
<script>
  Abba('test name')
    .control('test a', function(){ /* ... */ })
    .variant('test b', function(){ /* ... */ })
    .start();
</script>
```

The *control* is whatever you're testing against, and is usually the original page. You should only have one control (and the callback can be omitted).

The *variants* are the variations on the control that you hope will improve conversion. You can specify multiple variants. They require a variant name, and a callback function.

When you call `start()` Abba will randomly execute the control or variants' callbacks, and record the results server side.

Once the user has successfully completed the experiment, say paid and navigated to a receipt page, you need to complete the test. You can do this by invoking `complete()`.

```html
<script>
  // On successful conversion
  Abba('test name').complete();
</script>
```

You can find an example under `./public/test`.

### options

#### Persisting results

If set the `persist` option to `true`, then the experiment won't be reset once it has completed. In other words, that visitor will always see that particular variant, and no more results will be recorded for that visitor.

```html
<script>
  Abba('Pricing', {persist: true}).complete();
</script>
```

#### Weighting

You can set a variant weight, so some variants are used more than others:

```javascript
Abba('My Checkout')
  .control('Control', {weight: 20})
  .variant('Variant 1', {weight: 3}, function(){
    $('#test').text('Variant 1 was chosen!');
  })
  .variant('Variant 2', {weight: 3}, function(){
    $('#test').text('Variant 2 was chosen!');
  })
  .start();
```

In the case above, the Control will be invoked 20 times more often than the other variants.

### Flow control

You can continue a previously started test using `continue()`.

```javascript
Abba('My Checkout')
  .control()
  .variant('Variant 1', function(){
    $('#test').text('Variant 1 was chosen!');
  })
  .variant('Variant 2', function(){
    $('#test').text('Variant 2 was chosen!');
  })
  .continue();
```

Nothing will be recorded if you call `continue()` instead of `start()`. If a variant hasn't been chosen previously, nothing will be executed.

You can reset tests using `reset()`.

```javascript
Abba('My Checkout').reset();
```

Lastly, you can calculate the test that you want to run server side, and just tell the JavaScript library which flow was chosen.

```javascript
Abba('My Checkout').start('Variant A');
```

### Links

If you're triggering the completion of a test on a link click or a form submit, then things get a bit more complicated.

You need to ensure that tracking request doesn't get lost (which can happen in some browsers if you request an image at the same time as navigating). If the link is navigating to an external page which you don't control, then you have no choice but to cancel the link's default event, wait a few milliseconds, then navigate manually:

```html
<script>
  $('body').on('click', 'a.external', function(e){
    // Prevent navigation
    e.preventDefault();
    var href = $(this).attr('href');

    Abba('My Links').complete();

    setTimeout(function(){
      window.location = href;
    }, 400);
  });
</script>
```

That's far from ideal though, and it's much better to place the tracking code on the page you're going to navigate to. If you have control over the page, then add the following code that checks the URL's hash.

```html
<script>
  if (window.location.hash.indexOf('_abbaTestComplete') != -1) {
    Abba('My Links').complete();
  }
</script>
```

Then add the hash to the link's URL:

```html
<a href="/blog#_abbaTestComplete">
```

## License
MIT License. See the [LICENSE](LICENSE) file.
