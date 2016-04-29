window.addEventListener('message', receiveMessage, false);

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
});

function receiveMessage(event) {
  var origin = event.origin || event.originalEvent.origin;
  if (origin !== "http://www.hyperbench.com") {
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
