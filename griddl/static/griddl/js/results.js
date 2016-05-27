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

  $('#fileChooser').on('change', function(event) {
    Griddl.IO.HandleLocalLoad(event.target.files);
  });
});

function receiveMessage(event) {
  var origin = event.origin || event.originalEvent.origin;
  if (origin !== playground) {
    return false;
  }

  data = event.data;

  if (data.action) {
    switch (data.action) {
      case 'load':
        Griddl.Core.Main(Griddl.Components, data.text);
        break;
      case 'save':
        text = Griddl.Core.SaveToText();
        event.source.postMessage(text, origin);
        break;
      default:
        console.log('problem.', data);
    }
  }
}
