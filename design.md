
# Hyperbench: Design and Implementation


#### Components

The heart of Hyperbench is Components.  Each component is a self-contained unit that holds data, exposes an interface for manipulating that data, and possibly draws itself onto the document canvas.  Components are displayed on the left side of the screen in a vertical stack.

The user interface of each component has a header and a body.  The header holds common UI elements like handles for reordering, a type label, a name input, action buttons, upload/download buttons, and minimize/destroy buttons.  The body can be arbitrary HTML - the body is how the user manipulates the data held by the component.  This data can be arbitrary JSON, but two common forms are text and tabular data.  Text is often displayed in a CodeMirror widget, and tabular data is often displayed in a Handsontable widget.

All Components must define certain functions such as `load()`, `write()`, `add()`, `refresh()`, `getText()`, `setText()`, `getData()`, `setData()`, etc.

New Components can be written as plugins - the Component must implement the required functions and fields.


#### Canvas

It is desirable to have a WYSIWYG document display that can be exported to PDF.  To implement this, Hyperbench has a canvas library that translates HTML Canvas commands to PDF commands.  Client code can just use the HTML Canvas interface, and the commands will both draw to a `&lt;canvas&gt;` element on screen as well as be converted to PDF commands and stored in a shadow PDF file.

Canvas also has limited SVG support, but this has been neglected in favor of PDF.


### Document components

Alongside components that hold code and data, there are special component types that handle the specifics of documents.  These components will deal with document settings, page settings, and drawing onto the document.

#### The Document component

The presence of a Document component in a workbook indicates that a document will be drawn.  A Document component is optional - the workbook functions fine without one.  Global document settings, such as page size, screen resolution, and userspace unit definition, are stored here.  There are three measurement units that will be used in a document: *pixels* for displaying on the screen, *points* for displaying on the page, and what we call *cubits* for the unit used by user code.  The user defines the number of cubits that will make up an inch, centimeter, etc.  For example, a user may decide to define 1 inch = 100 cubits, which is easy to work with.  Points are fixed at 72 points per inch.  Pixels per inch can be set to an arbitrary number.

#### The Section component

The Section component defines a sequence of continuous content, such as chapter of text.  The Section will separate the content into pages for PDF export, but the Section is treated as one continuous segment for user interface purposes.  This means that the Section will be represented by a single `&lt;canvas&gt;` element, so that dragging content across the section can be done without having to drag content across multiple `&lt;canvas&gt;`es.  This might become a problem if users want to define very large Sections, because browsers have hard limits on the size of the `&lt;canvas&gt;`.  To mitigate this, the user can pick a lower resolution so that the `&lt;canvas&gt;` takes up fewer pixels.  Page breaks are delineated by dashed lines on the continuous `&lt;canvas&gt;`.  Margins and portrait/landscape orientation are defined in the Section component.

margin:{tp,rt,lf,bt}, interalMargin (gap between columns, margin from images/captions), nColumns, linePitch, indent, font, etc.
then Paragraph widgets will be created for each box on the page
when laying out text, it must avoid other widgets (think images and captions) that are overlaid on the page

#### Layout

The layout algorithm looks first at the block components in a section.  These have a defined position and size - they are drawn onto the page first, and then the paragraph text fills in the gaps.  We use the Knuth-Plass linebreaking algorithm, as implemented by Bram Stein.


#### Ordering of content

Content is drawn to the document in the same order as their corresponding components.  To rearrange Sections, just rearrange the Section components, and the rendering of the document will follow.  Components like images, charts, etc. belong to the nearest Section above them.  As you read the components from top to bottom, the block components belong to the most-recently encountered Section.

* Section 1
* Image A
* Section 2
* Image B

So if the components are ordered as above, Image A will be drawn in Section 1 and Image B will be drawn in Section 2.  If you want to move Image B to Section 1, just reorder the components like so:

* Section 1
* Image A
* Image B
* Section 2

Since the Section is treated as one continuous sequence of pages, the page index of an image can just be encoded as the y-coordinate.



### Component types

Block components include tables, lists, charts, and images.

Component subclasses - additional constraints on the data
Component.Grid -> BarChartData, LineChartData, TextData, Footnotes, Endnotes, SectionHeaders, Captions, etc.
Component.Text -> Document, Markdown, ProseMirror, Graphviz, Variables, BarChartLinked, LineChartLinked


#### Charts

specialized grid component types: BarChartData, LineChartData, ListData, etc.
two ways to do it: either enforce header names, or require a mapping from arbitrary header names to the graphical meaning (x, y, height, width, etc)
right now we enforce header names, which is easier.  but that might force people to have two mostly-redundant grids - one for the raw data and then one for the chart in its enforced format.  allowing for a mapping would possibly allow people to just use their raw data grid
on the other hand, people could just add new x, y, width, etc. columns to their raw data grid and calculate via formulas
ok.  i like that.  enforce header names, people can add columns if they want



#### Formulas

perhaps the default Grid should be excel-style: A1, A2, etc. - 1-indexed
or maybe FormulaGrid can be a subtype of Grid



#### Captions

captions could be an inherent part of the Image component - but there are questions as to top/left/bottom/right
and also, charts and such could use captions too, but there's no straightforward way to put the caption in the component
in the spirit of having data in the components and presodata in the Document component, we could put caption placement data in the Document component
the caption can just be a single-line `&lt;input&gt;` right below the header line for the component
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

when you mouse over a variable in text, display the cell outline.  click to edit the cell, and you get a formula
otherwise, the unit of editing is the paragraph.  click anywhere in a paragraph outside of variables, and you display a textarea with the paragraph




#### Handlers

the object currently hovered has control of all handlers for the canvas - onmousemove, onmousedown, onmouseup
which means it must detect when the mouse leaves its box, and then call this.dehover(), then parent.onhover(e)
(it might be that the mouse has also left the parent box, so the parent should immediately check for dehover itself)

on clearing:
the general principle is that we don't want to do page redraws on mousemoves (excepting drags, that is - page redraw on drag is necessary)
so far, all we do on mousemove is draw handles and arrows on hover, and then clear them when the mouses moves on
so handles and arrows have their own clear functions that draw a saved patch of canvas
but for anything involving a mousedown, just redraw the whole page


#### Undo

All nonvolatile changes will ultimately modify the text representation of the component.  Which means that any changes can be undone by either

1. storing the previous JSON, or
2. storing a command which will reverse the change.

Clearly, #1 is easier to implement but requires more storage space, and #2 is harder but uses less storage.  Therefore, we should start with #1 and implement #2 when we run up against resource limits.



#### Django app


#### Deployment


#### Sandboxing





