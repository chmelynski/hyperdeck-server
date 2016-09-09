* components.js - the main Hyperdeck functions
* workbook.js - handles the playground part of the workbook
* results.js - handles the sandbox part of the workbook
* directory.js - stuff for the directory view
* utils.js - stuff used by the three preceding files
* appserver.js - an unnecessary and experimental nodejs filesystem interface
* defaultProxyHandler.js - i experimented with Proxy's for use in implementing undo/redo - didn't work that well, unwieldy, slow
* defaultFonts.js - current practice is to package fonts into js files and use opentype.js to parse
* helpers.js - probably should be moved to widgets/ or a new folder - helper functions for user use
* import.js - broken out so it can be excluded if importing is disallowed for the current user
* layout.js - an early attempt at document layout - obsolete, but it was an interesting and different approach so i'm loathe to delete
* polyfills.js - canvas doesn't define drawLine(x1, y1, x2, y2) or draw/fillCircle(x, y, r)
* fonts.js - obsolete definition of fonts using paths (also before i knew about Path2D, so the paths are broken down into lists)
* griddl.io.js - i don't think anything uses this, but it as unicode<->uint8array, which could be useful in the future
* griddl.ui.js - i don't know what uses this.  i think something does though
* handlersGeneric.js - this is similar to Box in being a common set of functions for use by document components
