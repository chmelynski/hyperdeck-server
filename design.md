
# Hyperdeck: Design and Implementation

#### Purpose

The motivation behind Hyperdeck is the recognition that the browser has become a powerful platform.  The built-in facilities for programming and graphical interaction have matured and standardized to the point where the browser can outclass, rather than simply match, desktop software.  Desktop office software is powerful, well-designed (well, spreadsheets are, anyway), and ubiquitous.  The basic form, however, dates from the 70s and 80s and has remained essentially unchanged.  Not that there's anything wrong with that, but the technological environment is very different now, primarily with the development of the web.  Attempts to port office software to the web have mostly been direct ports of the interface - everything looks the same, you're just in the browser now.  This makes for a smooth user transition, but ultimately does not represent innovation as such.  The browser is a fundamentally different platform than the desktop computers of the 80s, and demands a fundamentally different approach to office software.

One of the main design problems faced in the building of Hyperdeck was how to unify the different parts of the office software suite.  There are basically two dimensions of unification: one is the unification of the office triad: spreadsheets, word processors, and presentation editors.  The other is the unification of interaction modes: direct, indirect, and programmatic manipulation.

We want to enable and integrate three separate modes of interaction: direct manipulation, indirect manipulation, and programmatic manipulation.  Direct manipulation means interaction with the visual elements of the document - for the most part, pointing, clicking, and dragging with the mouse or by touch.  Indirect manipulation involves interacting with GUI inputs - textboxes, number sliders, color pickers, etc.  Programmatic manipulation involves modifying variables via code. Existing office software has a mix of all three, but is clearly the messy result of evolution rather than integrated design.  Programmatic manipulation in particular was bolted on several years after the fact, using a language popular in the 80s but which has since been buried in sand everywhere except office software.


#### Components

The heart of Hyperdeck is components.  Each component is a self-contained unit that holds data, exposes an interface for manipulating that data, and possibly draws itself onto the document canvas.  Components are displayed on the left side of the screen in a vertical stack.

The user interface of each component has a header and a body.  The header holds common UI elements like handles for reordering, a type label, a name input, and minimize/destroy buttons.  The body can be arbitrary HTML - the body is how the user manipulates the data held by the component.

All components must define certain fields and functions such as:

* `type` - `txt`, `grid`, `document`, etc.
* `name` - `getText`, `setText`, `getData`, and `setData` take the component name as an argument
* `visible` - a boolean that determines whether the component is displayed as maximized or minimized

* a constructor, which takes an optional json argument - if there is no argument, the constructor must provide default values
* `add()` - this generates the component interface body, consisting of codemirror, handsontable, dat.gui, and possibly other HTML
* `write()` - export to JSON
* `getText()` - returns a text representation of the data contained within the component
* `setText()` - sets the text representation of the data
* `getData()` - returns the data in some sort of object format - a compiled function, a javascript object, a Uint8Array, etc
* `setData()` - sets the data

Internally, the component will usually have either or both of a `text` and `data` fields.  It will vary based on whether there is a textual or object representation of the data.  But this is an implementation detail, the only thing required of components is that they have `get/set Text/Data` functions.  Note that implementing these functions as a no-op is perfectly okay if the function isn't appropriate to a given component type.

New components can be written as plugins - the component must implement the required functions and fields.

Hyperdeck workbooks are stored in JSON format, as a list of component objects.  Any fields besides `type`, `name`, `visible`, `text`, and `data` are typically packaged into a `params` sub-object.


##### Code

A Code component holds data that is best represented as text.  Currently supported types are javascript, html, markdown, css, and plain text, corresponding to the `type` fields `js`, `html`, `md`, `css`, and `txt`.  These types have slightly different behavior, but not different enough to warrant a completely separate class.  The text is displayed in a Codemirror instance with appropriate highlighting.  The Code component is the primary way for users to write and execute javascript code, and the primary way to construct an HTML document.

Here's what happens to the code contained in each of those 5 types:

Code in a `js` component is NOT executed automatically - you have to click the `[Run Code]` button.  (if you want code to run automatically you can put it in a `<script>` tag in an `html` component)

Code in a `html` component gets packaged into a `<div>` and added to `#output` - this happens automatically on load and on blur after editing
Code in a `md` component gets converted from markdown to HTML, packaged into a `<div>`, and added to `#output`
Code in a `css` component gets packaged into a `<style>` and added to `#output`

Code in a `txt` component is completely inert, it's just for taking notes or whatever

We id `<div>`'s with the name of the component that created them.  So a component named "html1" creates a `<div id="html1">`

Stuff is added to `#output` in the order it shows up in the components, so you can move stuff around in the document by reordering the components


##### Data

A Data component holds a plain acyclical javascript object.  This object may be displayed in different forms, depending on its structure.  Display as JSON and YAML is always available for an object of any structure.  If the object has a structure amenable to display in a grid, it can be displayed in a Handsontable.  Permitted structures are an object of primitives, a list of primitives, a list of objects of primitives, and a list of lists of primitives.  As a shorthand, we can refer to those forms as `{}`, `[]`, `[{}]`, and `[[]]`.  These gridlike structures can also be displayed as editable CSV, TSV, or TSV in a `<pre>` tag.

One of the earliest motivations of this project was the frustration of not being able to properly name columns in Excel.  A `[{}]` will be displayed with named columns and can be referred to with field names by code, rather than by A1-style referencing.  If the underlying data is a list of objects, then each row is an object (0-indexed) and each column is a field.  To refer to a data cell, you write `getData(componentName)[objectIndex].fieldName`, e.g. `getData('foo')[0].bar`.  If the underlying data is a list of lists, it can be accessed with `getData(componentName)[rowIndex][colIndex]`, such as `getData('foo')[0][0]`.

Now, the implementation of various aspects of Handsontable present a lot of complications to our goals.  For instance, column headers are uneditable in normal operation.  That's sort of a good thing - other ways of implementing column headers would rely on convention (such as "column headers go in the first row"), but there wouldn't be anything special about the cells containing column headers.  What I wish happened is that column headers retain their special status, except that they can be selected and edited like any other cell.  But arrow keys, for instance, would not be able to move the selection to a column header.  It would have to be specially clicked on.  But I'd also like a pony.  What we have are fixed column headers, which means we need a means of changing those names if we want.  The way we do this is to toggle the display to TSV, edit the column name, and then toggle back.

When you add a column via the grid menu, the column will have a default A1-style name, which will probably need to be changed.

Handsontable is limited to displaying 1000 rows.  If the data is larger, it displays an internally operated scrollbar.  This isn't terrible, but it's clear that Handsontable is not for big data.  In order to store and display larger amounts of data, we have a `pre` component type, where the data is basically just displayed in TSV format in a `<pre>` element.  This is fairly lightweight as far as the DOM is concerned.


##### File

The File component stores user-uploaded files such as javascript libraries or images.  These are treated specially, but any type of file may be uploaded and accessed as a Uint8Array.  The corresponding component types are `jsfile`, `imgfile`, and `file`.  A `jsfile` will be packaged into a `<script>` tag and added to `#output`.  For now, an `imgfile` will not be added to `#output` by default - but we may want to change that in the future.  To add an image to the output, the user will have to construct an `<img>` tag in an HTML component and then set `img.src = getText('imgFileName')` via javascript.  This is obviously clunky.


##### Codemirror

Codemirror, by Marijn Haverbeke, is the library used to display and edit text.


##### Handsontable

Handsontable is the library used to display and edit grid data.


##### dat.gui

Many components use dat.gui as an interface for exposing their fields.

One undesired feature of dat.gui is that guis are hidden upon pressing 'H'.  This is global and is not able to be turned off with an option.  So disabling it requires that the `HIDE_KEY_CODE` constant be set to -1.




##### Programmatic manipulation

At one point, I envisioned that every component would have a switch to toggle between an HTML interface and a JSON representation.  This would aid discoverability for programmatic manipulation.  But eventually I discarded that idea in favor of having the dat.gui folder structure mirror the field names.




#### Canvas

It is desirable to have a WYSIWYG document display that can be exported to PDF.  To implement this, Hyperdeck has a canvas library that translates HTML Canvas commands to PDF commands.  Client code can just use the HTML Canvas interface, and the commands will both draw to a `<canvas>` element on screen as well as be converted to PDF commands and stored in a shadow PDF file.

Canvas also has limited SVG support, but this has been neglected in favor of PDF.


##### Fonts

We use the library opentype.js to read and draw fonts.  Currently we provide two free fonts when the app loads - a serif and a sans, both from Adobe under a libre license.  There are a few routes and options for delivery of the font file:

1. Deliver fonts on app load - easy, but heavyweight
2. Deliver fonts on request when used (user specifies a name) - harder, adds to delay when drawing a document for the first time, but lightweight
3. User uploads font

Getting text to display identically between the canvas and PDF turned out to be pretty difficult.  The native canvas handling of fonts is inadequate in two ways: first, I haven't found a way to get the canvas to use a user- or app- provided font file.  It might not be possible.  Also, setting font size behaves unpredictably - how many pixels 12pt is converted to is dependent on unknown factors, and we need precise control.  So, we generally don't use the native canvas `fillText()` function.  Text is drawn on screen by opentype.js, which reads the font file and draws the bezier curves.  The same method can be used to draw text in PDF - just let opentype.js draw the bezier curves.  But this results in a huge PDF file.  So we draw text natively in PDF, storing the font file in the PDF document and using the standard text display functions.


##### Transformations

One of the important tasks the canvas must handle is dealing with coordinate transformations.  There are many sources of coordinate transformations:

1. The `<canvas>` origin is at the top left, whereas the PDF origin is at the bottom left.  This requires a transform from the very start.
 a. Of course, this means that the PDF y-axis is flipped, which means that the PDF will draw text upside down - to avoid this you have to re-flip the y-axis with a text coordinate transformation (the Tm command, I believe).
2. The different scales - all user drawing commands are denominated in cubits, which then must be transformed into pixels and points.  The commands basically diverge - one copy gets transformed into pixels and ultimately CanvasRenderingContext2D calls, and another copy gets transformed into points and implemented via PDF drawing commands.
3. User code can have arbitrary transformations, which must play nicely with the transforms in #1 and #2.

##### Mathjax

There is some support for MathJax via the `drawMath()` function.  I've managed to keep asynchronity out of this app otherwise, but MathJax requires it - fortunately I've managed to contain the infection to a few rendering functions.  Calls to drawMath unfortunately do not draw directly onto the canvas, but rather are sent to MathJax.  The SVG shapes returned to the callback are then translated to canvas commands (this was implemented before I knew about Path2D, so it could be rewritten to be much shorter - still need to parse and deal with transformations, though) and drawn on screen / on PDF.


### Document components

Alongside components that hold code and data, there are special component types that handle the specifics of documents.  These components will deal with document settings, page settings, and drawing onto the document.


`Core.UploadWorkbook -> Document.exec -> Document.draw -> Section.draw`

Document.exec runs through the objs, setting:

`section.ctx = ctx;`
`section.document = this;`
`this.sections.push(section);`

`obj.section = section;`
`obj.ctx = ctx;`
`section.widgets.push(obj);`


style and fontFamily should both be dropdown boxes, based on available styles/fonts




#### The Document component

The presence of a Document component in a workbook indicates that a Canvas/PDF document will be drawn.  A Document component is optional - the workbook functions fine without one, and the user can just draw arbitrary HTML to the output <div>.  But I feel that breaking backwards compatibility with paper is the worst mistake HTML makes, and is a big part why HTML has not completely supplanted PDF in science and business.  Even if paper will finally be eliminated by iPads, you still need to use some sort of document format - PDF isn't going anywhere.

The variables defined in the Document component include page size, screen resolution, and userspace unit definition.  There are three measurement units that will be used in a document: *pixels* for displaying on the screen, *points* for displaying on the page, and what we call *cubits* for the unit used by user code.  The user defines the number of cubits that will make up an inch, centimeter, etc.  For example, a user may decide to define 1 inch = 100 cubits, which is easy to work with.  Points are fixed at 72 points per inch.  Pixels per inch can be set to an arbitrary number.

#### The Section component

The Section component defines a sequence of continuous content, such as chapter of text.  The Section will separate the content into pages for PDF export, but the Section is treated as one continuous segment for user interface purposes.  This means that the Section will be represented by a single `<canvas>` element, so that dragging content across the section can be done without having to drag content across multiple `<canvas>es`.  This might become a problem if users want to define very large Sections, because browsers have hard limits on the size of the `<canvas>`.  To mitigate this, the user can pick a lower resolution so that the `<canvas>` takes up fewer pixels.  Page breaks are delineated by dashed lines on the continuous `<canvas>`.  Margins and portrait/landscape orientation are defined in the Section component.

Variables defined in the Section component:

* `margin`
* `internalMargin` (gap between columns, possibly margin from images/captions)
* `nColumns`
* `linePitch`
* `indent`
* `font`
* etc.

It would be nice to have a way to directly edit the text displayed on the document.  The indirect method (of editing text on the components side, and then seeing it displayed on the document side) is fine, but it is serious change from the direct manipulation people do in Word.  But the whole notion of reimplementing direct manipulation text editors on a canvas is self-evidently a tarpit.

#### Layout

The layout algorithm looks first at the block components in a section.  These have a defined position and size - they are drawn onto the page first, and then the paragraph text fills in the gaps.  We use the Knuth-Plass linebreaking algorithm, as implemented by Bram Stein.


#### Ordering of content

Content is drawn to the document in the same order as their corresponding components.  To rearrange Sections, just rearrange the Section components, and the rendering of the document will follow.  Components like images, charts, etc. belong to the nearest Section above them.  As you read the components from top to bottom, the block components belong to the most-recently encountered Section.

* `Section 1`
* `Image A`
* `Section 2`
* `Image B`

So if the components are ordered as above, Image A will be drawn in Section 1 and Image B will be drawn in Section 2.  If you want to move Image B to Section 1, just reorder the components like so:

* `Section 1`
* `Image A`
* `Image B`
* `Section 2`

Since the Section is treated as one continuous sequence of pages, the page index of an image can just be encoded as the y-coordinate.



### Component types

Block components include tables, lists, charts, and images.

Component subclasses - additional constraints on the data
Component.Grid -> BarChartData, LineChartData, TextData, Footnotes, Endnotes, SectionHeaders, Captions, etc.
Component.Text -> Document, Markdown, ProseMirror, Graphviz, Variables, BarChartLinked, LineChartLinked


##### Subcanvases

We can't draw every conceivable document widget in-house.  There are dozens of charting libraries, for example - we want people to be able to use them.  But frequently these libraries aren't built to play nice with other things.  Many, for instance, expect an entire `<canvas>` for themselves, both for drawing and for setting event handlers.  We can't give them access to the full document `<canvas>`, lest they attempt to dominate it.

So, we have a Subcanvas component which creates a separate, moveable `<canvas>` element as a sort of sandbox for third party libraries to draw on.

Events:

We want to be able to move the subcanvas using our own standard Box logic, but also allow the events to pass through to the subcanvas so that the events set by the library work properly.  A way to solve this is to put a transparent screen over the subcanvas, then remove it on click.


A secondary use for subcanvases is to allow the user to directly write canvas drawing code, rather than having to create a component plugin.

Although we might also want a way to let the user draw directly onto the document canvas, instead of going through a subcanvas.

Should we use subcanvases to draw images, tables, and lists?  These are fundamental enough that I was planning to do them in-house, and we still could, but perhaps the subcanvas abstraction would help us and also allow for third party libraries to do the work.



Document
Section - Codemirror


Page - same as a section, but without text (this serves mainly to de-clutter the Section component UI, which tbh is a luxury)


Captions - Handsontable

Image
Table - Handsontable
List - Codemirror

Subcanvas - Codemirror


Title is a single textual element
Shape could also be a single visual element - have a Codemirror with an SVG path

Captions (perhaps rename to Titles) is a grid of multiple visual elements - text, in this case
Shapes is a grid of multiple visual elements - arbitrary

the problem with grids of multiple visual elements is that one component must be associated with multiple widget boxes
we have yet to work this out, and it is more cumbersome than one component = one widget box



#### Charts

One of the problems we face is mapping data from its natural format to a format readable by charts.  This is mostly about column headers - data in its native format might have column headers such as latitude and longitude, but a scatter chart needs to know x and y.  Plus there is often a mapping between the native field and the xy-coordinate.

There are basically two ways to do it:

1. Have a separate data grid specifically for the chart, with built-in headers for x, y, height, width, etc.
2. Define a mapping from the arbitrary header names in the native data grid to the graphical meaning

Option #1 has the benefit of being explicit, and can be implemented with cross-grid formulas (which are not implemented yet, but could be).  The problem is that it is redundant, requiring essentially an entire second copy of intermediate data.

Option #2 saves space, but it would need to be designed.  People would need a way to specify grid+column, and possibly define a mapping formula.

We could also imagine a third option, often used in Excel:

3. Allow the user to add x, y, columns to the native data grid.  This is a pretty good compromise, except that adding columns to a grid is not well supported (requiring an entire paste-in).


#### Formulas

The current formula implementation requires A1-style cell references, which conflicts with our desire to use meaningful column headers.

Possible ways to resolve this conflict:

1. Fix the formula implementation - obviously the best solution, also probably the hardest
2. Add FormulaGrids as a component type, which will use A1-references
3. Do what one does in Excel, and use the first data row to hold your column headers.  Clunky in all the same ways.



#### Captions

captions could be an inherent part of the Image component - but there are questions as to top/left/bottom/right
and also, charts and such could use captions too, but there's no straightforward way to put the caption in the component
in the spirit of having data in the components and presodata in the Document component, we could put caption placement data in the Document component
the caption can just be a single-line `<input>` right below the header line for the component
left/right/top/bottom and the size of those boxes can be adjusted in the GUI

indeed, paragraph components could have the section header done the same way as captions

axis labels (and chart titles, etc.) and chart footnotes and such should be Text objects that are sub-boxes of the chart



so there are 3 ways to store Text Content in the components:

1. each Text gets its own component - this is pretty damned unwieldy, although it could be mitigated by single line text inputs rather than textareas
2. the Texts get put into a grid, either one grid for the whole document, or one grid per section
3. the Texts are put directly into the document JSON - this is, basically, not data-centric enough

then there's the possibilitiy of different text grids according to function: one for section titles, one for footnotes, one for endnotes, one for captions, etc.  in these cases, the Content added would be presented as different objects, but the corresponding Components would be of similar forms

choices for storing Text data:

1. store all Text info in the document JSON
2. one grid for the entire document - specify section/page explicitly
3. one grid for each section - specify page explicitly
4. one component for each Text object

for now, we'll go with 1
but 2 would probably be a better option - subject Texts to formulas, variable replacement, etc
AddText adds a line to the global table
but AddText the button is a poor choice - better to click directly on the document, in AddText mode or something
and having the single-table Text infrastructure allows us to structure footnotes, captions, section headers, etc. in the same way
footnotes/endnotes/section headers are definitely the result of computations, so they need to be in a grid or otherwise computable


#### Variables

Variables are how we add intelligence and interactivity to numbers embedded inline within paragraph text.

First thoughts about the interface: when you mouse over a variable in text, display the cell outline.  Click to edit the cell, and you get a formula.

See the *Tangle* library, by Bret Victor.





#### Handlers

Mouse event handling is done by the Box abstraction, which is used by many types of components, as well as the handlers defined by each individual component type.

Handlers for dealing with mouse entry and exit of the owned region are named `onhover` and `dehover` by convention.

##### Box

Most block components are roughly box-shaped, and so can outsource handling of common functions, such as moving and alignment, to the Box abstraction.  The Box also deals with detecting and acting appropriately when the mouse enters and leaves its territory.  The UI for movement/alignment is the 9 handles drawn on the box.  The user grips a handle and drags to move the box.  The act of gripping a given handle also changes the alignment of the Box - to center the box both horizontally and vertically, grab the handle in the center of the box.  To align to top/left, grab the handle in the top left.

Dragging a handle across the background of the Section can be governed by a snap grid, whose spacing and look and feel can be customized in the Document component.  The Section is responsible for drawing the snap grid.  Draw order is important here - you want to draw the text background first, then draw the snap grid, then draw the handles over top of the snap grid.

The object currently hovered has control of all handlers for the canvas - `onmousemove`, `onmousedown`, `onmouseup`.  Which means it must detect when the mouse leaves its box, and then call `this.dehover()`, then `parent.onhover(e)`.  It might be that the mouse has also left the parent box, so the parent should immediately check for dehover itself.

On clearing: the general principle is that we don't want to do page redraws on mousemoves (excepting drags, that is - page redraw on drag is necessary).
So far, all we do on mousemove is draw handles and arrows on hover, and then clear them when the mouses moves on.  So handles and arrows have their own clear functions that draw a saved patch of canvas.  But for anything involving a mousedown, just redraw the whole section.

##### Arrows

Single-dimensional scaling changes are handled by Arrows.  The canonical example is the height of a bar chart column, which is some scaled factor of the underlying data.  Besides the sizing of graphical elements, Arrows can also be used for gaps and margins between graphical elements.  An Arrow has its own box that draws an arrow onhover.  Then onmousedown and onmousemove, the arrow expands/contracts and the graphical element is scaled accordingly.


#### Undo

All nonvolatile changes will ultimately modify the text representation of the component.  Which means that any changes can be undone by either

1. storing the previous JSON, or
2. storing a command which will reverse the change.

Clearly, #1 is easier to implement but requires more storage space, and #2 is harder but uses less storage.  Therefore, we should start with #1 and implement #2 when we run up against resource limits.



#### Django app



#### Deployment

##### Heroku

##### nginx/uWSGI


