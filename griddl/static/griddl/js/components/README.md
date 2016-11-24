Components are objects that hold data and provide controls for interacting with it.  Components are displayed on the left side of the workbook.  They have to implement an interface which is still pretty loosely-defined - you have to look in `components.js` to see what names are referenced.  A few here below:

* _type - html,css,md,js,txt,data,link,libraries,image,binary
* _name - user-defined, used to get the data via Hyperdeck.Get(componentName)
* _visible - maximized or minimized
* _add() - builds the component interface
* _write() - this is called when you save or export the workbook - component data is saved in a JSON file
* _afterLoad() - optional, implemented by Code, Libraries, maybe Link?
* _afterAllLoaded() - adds content to the document (html,css,md) or runs (js with runOnLoad=true)
* _get(options) - returns the data stored in the component
* _set(data, options) - sets the data stored in the component
