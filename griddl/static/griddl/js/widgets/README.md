Each file in this folder should define a single name, either namespaced in Hyperdeck or in the global scope.  These classes can be used by components or other code.

* Tree -> Twig
* Table (for display in a document) -> Grid/Hot/HtmlGrid
* Data -> Grid/Hot/HtmlGrid
* everything -> Box
* File (zipfile, in particular) -> TableGui
* document -> Canvas, Typeset
* lots of things -> Geometry

to implement:
* HtmlGrid (normal Grid is a canvas grid, this will use HTML tables)
* Parser (to standardize and centralize supported data formats)
