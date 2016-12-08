$.extend({
  alert: function(message, type) {
    var type = typeof type !== 'undefined' ? type : 'danger';
    template = "<div class='alert alert-{type}'><button class='close' data-dismiss='alert'>&times;</button><p>{msg}</p></div>";
    return $(template.replace(/\{type\}/, type).replace(/\{msg\}/, message)).appendTo('.header');
  }
});

// handle redirects required by ajax results
// this is called after the response is handled in directory.js
$(document).ajaxComplete(function(event, xhr, settings) {
  response = $.parseJSON(xhr.responseText);
  if (response.redirect) {
    document.location.href = response.redirect;
  }
});

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

function jslog(str, file) {
  if (!file) {
    file = '';
  }

  $.post("/jslog", 
         {
           'msg': str,
           'file': file,
           'page': document.location.href
         }
  );
}

// find data attributes or datasets by walking dom ancestors
function find_dataset(el, attr) {
  if (attr) {
    if (el.hasAttribute(attr)) {
      return el.dataset;
    } else {
      dataParent = $(el).closest('[' + attr + ']');
      return dataParent.dataset;
    }
  } else {
    if (Object.keys(el.dataset).length > 0) {
      return el.dataset;
    } else {
      // ehhhhhhhh
      data = false;
      $(el).parents().each(function() {
        if (Object.keys(this.dataset).length > 0) {
          data = this.dataset;
          return false; // break out of .each() loop, not the func
        }
      });
      return data;                                           
    }                                                  
  }                                                    
}
