(function($) {

  var playground = window.playground;

  Hyperdeck.dirty = false;
  var titleTag = document.getElementsByTagName('title')[0];

  Hyperdeck.Components.MarkDirty = function() {
    if (!Hyperdeck.dirty) {
      Hyperdeck.dirty = true;
      parent.postMessage({'action': 'markDirty'}, playground);
      $('#saveMenuButton').addClass("bg-danger");
    }
  };

  Hyperdeck.Components.MarkClean = function() {
    if (Hyperdeck.dirty) {
      Hyperdeck.dirty = false;
      parent.postMessage({'action': 'markClean'}, playground);
      $('#saveMenuButton').removeClass("bg-danger");
    }
  };
})(jQuery);
