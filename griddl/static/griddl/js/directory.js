// todo: the ajaxComplete handler and alert func probably belong in a diff file
//handle redirects required by ajax results
$(document).ajaxComplete(function(event, xhr, settings) {
  response = $.parseJSON(xhr.responseText);
  if (response.redirect) {
    document.location.href = response.redirect;
  }
});

$.extend({
  alert: function(message, type) {
    var type = typeof type !== 'undefined' ? type : 'danger';
    template = "<div class='alert alert-{type}'><button class='close' data-dismiss='alert'>&times;</button><p>{msg}</p></div>";
    $('.header').append(template.replace(/\{type\}/, type).replace(/\{msg\}/, message));
  }
});


function renameToggle() {
  // change display
  $('.renameForm, .namelink', '.selected').toggle()
}

function togglePublic(pk) {
  $.post('/togglepublic',
     { pk : pk }
  );
}

$(document).ready(function() {

  $('.renameForm').on('submit', function(event) {
    event.preventDefault();
    $tgt = $(event.target);
    name = $tgt.find('[name="newname"]').val();

    $.post("/rename",
      $tgt.serialize(),
      function(response) {
        if (response.success) {
          $tgt.closest('td').find('.namelink').attr('href', response.slug).text(name);
          renameToggle();
        } else {
          $.alert("Sorry, something went wrong. Please try again later.");
        }
      },
      "json"
    );
  });


  $('#deleteForm').on('submit', function(event) {
    event.preventDefault();
    
    $.post("/delete",
      $(event.target).serialize(),
      function(response) {
        if (response.success) {
          $sel = $('.selected');
          name = $sel.find('.namelink').text();
          $sel.remove();
          $.alert("Workbook " + name + " was deleted.", 'success');
          $('#deleteModal').modal('hide');
        } else {
          $.alert("Sorry, something went wrong. Please try again later.");
        }
      },
      "json"
    );
  });


  $('#moveForm').on('submit', function(event) {
    event.preventDefault();
    
    $.post("/move",
      $(event.target).serialize(),
      function(response) {
        // todo: this success handler is not done yet, pending fixing other issues w/ move & dirs
        if (response.success) { 
          $sel = $('.selected');
          name = $sel.find('.namelink').text();
          $sel.remove();
          $.alert("Workbook " + name + " was moved.", 'success');
        } else {
          $.alert("Sorry, something went wrong. Please try again later.");
        }
      },
      "json"
    );
  });

  $('#deleteModal').on('show.bs.modal', function(event) {
    $('#deleteIdInput').attr('value', $('tr.workbook.selected').attr('data-pk'));
  }).on('hide.bs.modal', function() {;
    $('#deleteIdInput').attr('value', '');
  });
  
  $('#moveModal').on('show.bs.modal', function(event) {
    $('#moveIdInput').attr('value', $('tr.workbook.selected').attr('data-pk'));
  }).on('hide.bs.modal', function() {;
    $('#moveIdInput').attr('value', '');
  });
  
  $('.workbook').on('click', function(e) {
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    $('.menuAction').prop('disabled',false);
    $('.menuAction').css('color','black');
    e.stopPropagation();
  });
  
  $('body').on('click', function(e) {
    $tgt = $(e.target);
    if ($tgt.hasClass('workbookAction') || $tgt.closest('button').hasClass('workbookAction')) {
      return;
    }
    $('.selected').removeClass('selected');
    $('.menuAction').prop('disabled',true);
  });

});
