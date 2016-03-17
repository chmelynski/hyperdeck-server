$(document).ready(function() {
  // button-group toggle for display modes
  $("#show-components").on('click', function(e) {
      if ($(e.target).hasClass('active')) {return;}
      $(e.target).addClass('active').siblings().removeClass("active");
      $("#cells").css('display', 'block').parent().removeClass('col-sm-6').addClass('col-sm-12');
      $("#output").css('display', 'none');

  });
  $("#show-all").on('click', function(e) {
      if ($(e.target).hasClass('active')) {return;}
      $(e.target).addClass('active').siblings().removeClass("active");
      $("#cells, #output").css('display', 'block').parent().removeClass("col-sm-12").addClass("col-sm-6");
  });

  $("#show-widgets").on('click', function(e) {
      if ($(e.target).hasClass('active')) {return;}
      $(e.target).addClass('active').siblings().removeClass("active");
      
      $("#output").css('display', 'block').parent().removeClass('col-sm-6').addClass('col-sm-12');
      $("#cells").css('display', 'none');
  });

  // cancel/clear documentSettings on modal close
  $('#documentSettings').on('hide.bs.modal', function() {
    Griddl.UI.CancelDocumentSettings()
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

});
