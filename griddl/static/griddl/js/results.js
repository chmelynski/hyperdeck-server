window.addEventListener('message', receiveMessage, false);

var playground = window.location.protocol + "//";
chunks = window.location.hostname.split('.');
if (chunks[0] == "griddl") {
  chunks[0] = "www";
} else {
  chunks[0] = chunks[0].slice(7);
}
playground += chunks.join('.');


$(document).ready(function() {
  // button-group toggle for display modes
  $("#show-components").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      $("#cells-container").css('display', 'block').removeClass('col-sm-6').addClass('col-sm-12');
      $("#output-container").css('display', 'none');

  });

  $("#show-all").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      $("#cells-container, #output-container").css('display', 'block').removeClass("col-sm-12").addClass("col-sm-6");
  });

  $("#show-widgets").on('click', function(e) {
      $btn = $(e.target).closest('button');
      if ($btn.hasClass('active')) {return;}
      $btn.addClass('active').siblings().removeClass("active");
      
      $("#output-container").css('display', 'block').removeClass('col-sm-6').addClass('col-sm-12');
      $("#cells-container").css('display', 'none');
  });

  $("#up").on('click', function(event) {
    event.preventDefault();
    parent.postMessage({'action': 'nav', 'uri': event.currentTarget.pathname}, playground);
  });

  $('#saveMenuButton').on('click', function(event) {
    save().done(function(success) {
      if (success) {
        $.alert('Your workbook has been saved.', 'success');
        Griddl.markClean();
      }
    });
  }); 

  $('#saveAsForm').on('submit', function(event) {
    event.preventDefault();
    saveAsSubmit();
  });

  $('#saveAsSubmit').on('click', function(event) {
    event.preventDefault();
    saveAsSubmit();
  });

  $('#fileChooser').on('change', function(event) {
    Griddl.IO.HandleLocalLoad(event.target.files);
  });

});

function saveAsSubmit() {
  newname = $("[name='newname']").val();

  if (!validateName(newname)) {
    return false;
  }

  save_as(newname).done(function(success) {
    if (success) {
      $('#workbookName').text(newname);
      path = window.location.pathname
      newpath = path.slice(0, path.lastIndexOf('/')+1) + newname;
      history.replaceState('workbook-rename', 'Renamed workbook', newpath);
      $.alert('Workbook renamed to ' + newname + '.', 'success');
      $('.modal').modal('hide');
    }
  });
}

function receiveMessage(event) {
  var origin = event.origin || event.originalEvent.origin;
  if (origin !== playground) {
    return false;
  }

  data = event.data;

  if (data.action) {
    switch (data.action) {
      case 'load':
        Griddl.Components.Main(data.text);
        break;
      case 'resolve':
        console.log(data);
        window[data.deferred].resolve(data.success);
        break;
      case 'modal_close':
        $(".modal").modal('hide');
        break;
      default:
        console.log('problem in sandbox: ', data);
    }
  }
}

function save() {
  text = Griddl.Components.SaveToText();
  var saveResult = window.saveResult = $.Deferred();
  parent.postMessage({'action': 'save', 'text': text, 'deferred': 'saveResult'}, playground);

  return saveResult.promise();
}

function save_as(newname) {
  text = Griddl.Components.SaveToText();
  var saveAsResult = window.saveAsResult = $.Deferred();

  parent.postMessage({'action': 'save_as', 'text': text, 'newname': newname, 'deferred': 'saveAsResult'}, playground);

  return saveAsResult.promise();
}
