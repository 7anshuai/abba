var Controller;

Controller = (function() {
  Controller.prototype.tag = 'div';

  Controller.prototype.events = {};

  function Controller(options) {
    this.options = options != null ? options : {};
    this.el = this.el || this.options.el || document.createElement(this.tag);
    this.$el = $(this.el);
    this.$el.addClass(this.className);
  }

  Controller.prototype.$ = function(sel) {
    return $(sel, this.$el);
  };

  Controller.prototype.append = function(controller) {
    return this.$el.append(controller.el || controller);
  };

  Controller.prototype.html = function(controller) {
    return this.$el.html(controller.el || controller);
  };

  return Controller;

})();

var Chart,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chart = (function(superClass) {
  extend(Chart, superClass);

  function Chart() {
    this.render = bind(this.render, this);
    this.fetch = bind(this.fetch, this);
    return Chart.__super__.constructor.apply(this, arguments);
  }

  Chart.prototype.fetch = function() {
    var url;
    url = "/admin/experiments/" + this.options.model._id + "/chart";
    return $.getJSON(url, this.options.params, this.render);
  };

  Chart.prototype.render = function(variants) {
    var $legend, $variant, area, height, i, j, len, line, margin, results, svg, svgVariant, variant, width, x, xAxis, y, yAxis;
    this.$el.empty();
    margin = {
      top: 30,
      right: 30,
      bottom: 30,
      left: 30
    };
    width = this.$el.width() - margin.left - margin.right;
    height = 300 - margin.top - margin.bottom;
    x = d3.time.scale().range([0, width]);
    y = d3.scale.linear().range([height, 0]);
    xAxis = d3.svg.axis().scale(x).tickSize(1).tickPadding(12).ticks(d3.time.days.utc, 2).orient('bottom').tickFormat(function(d, i) {
      return moment(d).format('MMM Do');
    });
    yAxis = d3.svg.axis().scale(y).ticks(5).tickPadding(5).orient('left');
    line = d3.svg.line().x(function(d) {
      return x(new Date(d.time));
    }).y(function(d) {
      return y(d.rate);
    });
    area = d3.svg.area().x(function(d) {
      return x(new Date(d.time));
    }).y0(height).y1(function(d) {
      return y(d.rate);
    });
    svg = d3.select(this.$el[0]).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', "translate(" + margin.left + "," + margin.top + ")");
    x.domain([
      d3.min(variants, function(c) {
        return d3.min(c.values, function(v) {
          return new Date(v.time);
        });
      }), d3.max(variants, function(c) {
        return d3.max(c.values, function(v) {
          return new Date(v.time);
        });
      })
    ]);
    y.domain([
      d3.min(variants, function(c) {
        return d3.min(c.values, function(v) {
          return v.rate;
        });
      }), d3.max(variants, function(c) {
        return d3.max(c.values, function(v) {
          return v.rate;
        });
      })
    ]);
    svg.append('g').attr('class', 'x axis').attr('transform', "translate(0," + height + ")").call(xAxis);
    svg.append('g').attr('class', 'y axis').call(yAxis);
    svg.selectAll('.areas').data(variants).enter().append('path').attr('class', function(d, i) {
      return "areas area-" + i;
    }).attr('d', function(d) {
      return area(d.values);
    });
    svgVariant = svg.selectAll('.variants').data(variants).enter().append('g').attr('class', function(d, i) {
      return "variants variant-" + i;
    });
    svgVariant.append('path').attr('class', 'line').attr('d', function(d) {
      return line(d.values);
    });
    svgVariant.selectAll('circle').data(function(d) {
      return d.values;
    }).enter().append('circle').attr('class', function(d, i) {
      return "circle circle-" + i;
    }).attr('cx', function(d, i) {
      return x(new Date(d.time));
    }).attr('cy', function(d, i) {
      return y(d.rate);
    }).attr('r', 4);
    $legend = $('<ul />').addClass('legend');
    this.$el.append($legend);
    results = [];
    for (i = j = 0, len = variants.length; j < len; i = ++j) {
      variant = variants[i];
      $variant = $('<li />').text(variant.name);
      $variant.addClass("legend-" + i);
      results.push($legend.append($variant));
    }
    return results;
  };

  return Chart;

})(Controller);

$(function() {
  $('body').on('click', 'a[data-confirm]', function(e) {
    var $el = $(e.target);
    if (!confirm($el.data('confirm'))) {
      e.stopImmediatePropagation();
      return false;
    }
  });

  $('body').on('click', 'a[data-method]', function(e) {
    e.preventDefault();

    var $el = $(e.target);
    $.ajax({
      url:  $el.attr('href'),
      type: $el.data('method'),
      success: function() {
        window.location.reload();
      }
    });
  });
});
