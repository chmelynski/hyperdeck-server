(function($) {

  var playground = window.playground;

  Griddl.dirty = false;
  var titleTag = document.getElementsByTagName('title')[0];

  Griddl.Components.MarkDirty = function() {
    if (!Griddl.dirty) {
      Griddl.dirty = true;
      parent.postMessage({'action': 'markDirty'}, playground);
      $('#saveMenuButton').addClass("bg-danger");
    }
  };

  Griddl.Components.MarkClean = function() {
    if (Griddl.dirty) {
      Griddl.dirty = false;
      parent.postMessage({'action': 'markClean'}, playground);
      $('#saveMenuButton').removeClass("bg-danger");
    }
  };
})(jQuery);
