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

//from django docs, impt for ajax csrf
function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie != '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
  beforeSend: function(xhr, settings) {
    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
  }
});
