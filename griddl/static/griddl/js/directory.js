function renameToggle() {
  // change display
  $('.renameForm, .namelink', '.selected').toggle()
}

function togglePublic(pk) {
  $.post('/togglepublic',
         { pk : pk },
         function (response) {
           if (response.success) {
             $.alert('Workbook status successfully toggled.', 'success');
           } else {
             $.alert('Sorry - an error occurred. Please try again later.', 'danger');
           }
         },
         'json'
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
          $tgt.closest('td').find('.namelink').attr('href', response.uri).text(name);
          renameToggle();
        } else {
          $.alert(response.message, 'danger');
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
          filetype = (($sel.find('.namelink').attr('href').startsWith('/d')) ? 'Folder ' : 'Workbook ');
          $sel.remove();
          $.alert(filetype + "'" + name + "' was deleted.", 'success');
          $('#deleteModal').modal('hide');
        } else {
          $.alert("Sorry, something went wrong. Please try again later.", 'danger');
        }
      },
      "json"
    );
  });
  
  $('#newWorkbookForm').on('submit', function(event) {
    event.preventDefault();
    $.post("/create",
      $(event.target).serialize(),
      function(response) {
        if (response.success) {
          $.alert("Success! You will be redirected to the new workbook momentarily.", 'success');
        } else {
          $.alert(response.message, 'danger');
        }
      },
      "json"
    );
  });

  $('#newDirectoryForm').on('submit', function(event) {
    event.preventDefault();
    $.post("/createDir",
      $(event.target).serialize(),
      function(response) {
        if (response.success) {
          $.alert("Success! You will be redirected to the new directory momentarily.", 'success');
        } else {
          $.alert(response.message, 'danger');
        }
      },
      "json"
    );
  });


  $('#moveForm').on('submit', function(event) {
    event.preventDefault();
    
    //var $dest = $('select', event.target);
    //var dest = $dest.val();
    $.post('/move',
      $(event.target).serialize(),
      function(response) {
        if (response.success) { 
          var $sel = $('.selected');
          var name = $sel.find('.namelink').text();
          $sel.remove();
          $.alert('"' + name + '" was moved to "' + response.dstFolder + '" folder.', 'success');
          $('#moveModal').modal('hide');
        } else {
          $.alert(response.message, 'danger');
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
