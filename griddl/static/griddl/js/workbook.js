$(document).ready(function() {
  // button-group toggle for display modes
  $("#show-components").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      $("#cells").css('display', 'block').parent().removeClass('col-sm-6').addClass('col-sm-12');
      $("#output").css('display', 'none');

  });

  $("#show-all").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      $("#cells, #output").css('display', 'block').parent().removeClass("col-sm-12").addClass("col-sm-6");
  });

  $("#show-widgets").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      
      $("#output").css('display', 'block').parent().removeClass('col-sm-6').addClass('col-sm-12');
      $("#cells").css('display', 'none');
  });

  $('#saveMenuButton').on('click', function(event) {
    event.preventDefault();
    $form = $('#saveForm');
    $form.find("#saveFormTextInput").val(Griddl.Core.SaveToText());
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
  });

  $('#saveAsSubmit').on('click', function(event) {
    event.preventDefault();
    save_as();
  });
  $('#saveAsForm').on('submit', function(event) {
    event.preventDefault();
    save_as();
  });

});

function save_as() {
  $form = $('#saveAsForm');
  newname = $form.find("[name='newname']").val();

  if (!validateName(newname)) {
    return false;
  }

  $.post('/saveas',
         $form.serialize(),
         function(response) {
           if (response.success) {
             $('#workbookName').text(newname);
             path = window.location.pathname
             newpath = path.slice(0, path.lastIndexOf('/')+1) + newname;
             history.replaceState('workbook-rename', 'Renamed workbook', newpath);
             $.alert('Workbook renamed to ' + newname + '.', 'success');
             $('.modal').modal('hide');
           } else {
             $.alert('Something went wrong. Please try again later.');
             $('.modal').modal('hide');
           }
         },
         'json'
        );
}
