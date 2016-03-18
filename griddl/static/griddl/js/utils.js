$.extend({
  alert: function(message, type) {
    var type = typeof type !== 'undefined' ? type : 'danger';
    template = "<div class='alert alert-{type}'><button class='close' data-dismiss='alert'>&times;</button><p>{msg}</p></div>";
    $('.header').append(template.replace(/\{type\}/, type).replace(/\{msg\}/, message));
  }
});

//handle redirects required by ajax results
$(document).ajaxComplete(function(event, xhr, settings) {
  response = $.parseJSON(xhr.responseText);
  if (response.redirect) {
    document.location.href = response.redirect;
  }
});

function validateName(str) {
  // don't allow names with forward slashes. ever.
  if (str.indexOf("/") == -1) {
    return true;
  } else {
    $.alert('Sorry, "/" (forward-slash) is not allowed in file or folder names.');
    return false;
  }
}
