$(document).ready(function() {
  text = $('#frce').text();
  message = {'text': text, 'action': 'load'}
  $('iframe').load(function() {
    document.getElementById('results').contentWindow.postMessage(message, "http://griddl.hyperbench.com");
  });

  $('#saveMenuButton').on('click', function(event) {
    event.preventDefault();
    request_text().done(save);
  });


  $('#saveAsSubmit').on('click', function(event) {
    event.preventDefault();
    request_text().done(save_as);
  });
  $('#saveAsForm').on('submit', function(event) {
    event.preventDefault();
    request_text().done(save_as);
  });

});

function request_text() {
  var deferred = $.Deferred();

  document.getElementById('results').contentWindow.postMessage({'action': 'save'}, "http://griddl.hyperbench.com");

  window.addEventListener(
    'message', 
    function(event) {
      var origin = event.origin || event.originalEvent.origin;
      if (origin !== "http://griddl.hyperbench.com") {
        return false;
      }

      console.log("in deferred:", event.data);

      deferred.resolve(event.data);
    }, 
    false
  );

  return deferred.promise();
}

function save_as(text) {
  $form = $('#saveAsForm');
  $form.find('#saveAsFormTextInput').val(text);
  newname = $form.find("[name='newname']").val();

  if (!validateName(newname)) {
    return false;
  }

  $.post('/saveas',
         $form.serialize(),
         function(response) {
           if (response.success) {
             if (!response.redirect) {
               $('#workbookName').text(newname);
               path = window.location.pathname
               newpath = path.slice(0, path.lastIndexOf('/')+1) + newname;
               history.replaceState('workbook-rename', 'Renamed workbook', newpath);
               $.alert('Workbook renamed to ' + newname + '.', 'success');
               $('.modal').modal('hide');
             }
           } else {
             $.alert('Something went wrong. Please try again later.');
             $('.modal').modal('hide');
           }
         },
         'json'
        );
}

function save(text) {
  console.log("in save:", text);
  $form = $('#saveForm');
  $form.find("#saveFormTextInput").val(text);
  $.post("/save",
         $form.serialize(),
         function(response) {
           if (response.success) {
             $.alert('Workbook saved.', 'success');
           } else {
             $.alert(response.message);
           }
         },
         'json'
         );
}
