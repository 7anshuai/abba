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
