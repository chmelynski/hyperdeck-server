
// https://developer.mozilla.org/en-US/docs/Web/WebGL
// https://developer.mozilla.org/en-US/docs/Web/WebGL/Using_textures_in_WebGL
// https://developer.mozilla.org/en-US/docs/Web/WebGL/Lighting_in_WebGL
// https://www.khronos.org/registry/webgl/specs/1.0/#5.14.8

// demo
// https://developer.mozilla.org/samples/webgl/sample6/index.html

var canvas;
var gl;

var texture;
var cubeVerticesBuffer;
var cubeVerticesColorBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeRotation = 0.0;
var cubeXOffset = 0.0;
var cubeYOffset = 0.0;
var cubeZOffset = 0.0;
var lastCubeUpdateTime = 0;
var xIncValue = 0.1;
var yIncValue = -0.1;
var zIncValue = 0.1;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var textureCoordAttribute;
var perspectiveMatrix;

function start() {
	
	canvas = document.getElementById("glcanvas");
	gl = canvas.getContext("webgl"); // "experimental-webgl"
	
	gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear to (r,g,b,a) a=1.0 => opaque
	gl.clearDepth(1.0);                 // Clear everything
	gl.enable(gl.DEPTH_TEST);           // Enable depth testing
	gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
	
	initShaders();
	initBuffers();
	
	setInterval(drawScene, 15);
	//drawScene();
}
function initBuffers() {
	
	// moved to external files
	
	//var vertices = [];
	//var colors = [];
	
	// Select the cubeVerticesBuffer as the one to apply vertex operations to from here out.
	
	// Pass the list of vertices into WebGL to build the shape. We
	// do this by creating a Float32Array from the JavaScript array,
	// then use it to fill the current vertex buffer.
	
	// Now set up the colors for the faces. We'll use solid colors
	// for each face.
	
	//var black = [ 000/255 , 000/255 , 000/255 , 255/255 ];
	//var white = [ 255/255 , 255/255 , 255/255 , 255/255 ];
	//var flesh = [ 231/255 , 162/255 , 099/255 , 255/255 ];
	
	// Each vertex gets a color associated with it.  The color on the polygon is linearly interpolated
	// Repeat each color three times for the three vertices of each triangle
	
	
	// texture pixels must be a power of two: 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096 (supported by most devices), 8192 (supported by a few devices)
	texture = gl.createTexture();
	var img = new Image();
	img.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	img.src = textureSrc; // from the object file
	
	
	// from cube.js or whatever
	var vertices = globals.vertices;
	var colors = globals.colors;
	var vertexIndices = globals.vertexIndices;
	var textureCoordinates = globals.textureCoordinates;
	
	
	//var generatedColors = [];
	//
	//for (var j = 0; j < colors.length; j++)
	//{
	//	for (var i = 0; i < 3; i++)
	//	{
	//		generatedColors = generatedColors.concat(colors[j]);
	//	}
	//}
	
	// this just returns [0,1,2,3...]
	//var cubeVertexIndices = new Uint16Array(generatedColors.length);
	//for (var i = 0; i < vertices.length; i++)
	//{
	//	cubeVertexIndices[i] = i;
	//}
	
	cubeVerticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); // WebGLFloatArray for Firefox (and other Gecko)
	
	cubeVerticesIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
	
	
	// the color buffer and texture coord buffer are mutually exclusive - you only need one of them
	
	//cubeVerticesColorBuffer = gl.createBuffer();
	//gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
	//gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(generatedColors), gl.STATIC_DRAW); // WebGLFloatArray for Firefox (and other Gecko)
	
	cubeVerticesTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW); // WebGLFloatArray for Firefox (and other Gecko)
}
function drawScene() {
	
	// Clear the canvas before we start drawing on it.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Establish the perspective with which we want to view the
	// scene. Our field of view is 45 degrees, with a width/height
	// ratio of 640:480, and we only want to see objects between 0.1 units
	// and 100 units away from the camera.
	perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
	
	// Set the drawing position to the "identity" point, which is the center of the scene.
	loadIdentity();
	
	// Now move the drawing position a bit to where we want to start drawing the cube.
	//mvTranslate([0.0, 0.0, -6.0]);
	//mvRotate(-90, [1, 0, 0]);
	//mvPushMatrix(); // Save the current matrix, then rotate before we draw.
	//mvRotate(cubeRotation, [0, 0, 1]);
	//mvTranslate([cubeXOffset, cubeYOffset, cubeZOffset]);
	
	// Draw the cube by binding the array buffer to the cube's vertices array, setting attributes, and pushing it to GL.
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	// Set the colors attribute for the vertices.
	//gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesColorBuffer);
	//gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	
	// bind textures
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
	
	// Draw the cube.
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); // change gl.TRIANGLES to ??, also the 2nd param used to be vertices.length / 3, then i tried cubeVerticesIndexBuffer.length
	
	//// Restore the original matrix
	//mvPopMatrix();
	//
	//// Update the rotation for the next draw, if it's time to do so.
	//var currentTime = (new Date).getTime();
	//
	//if (lastCubeUpdateTime) 
	//{
	//	var delta = currentTime - lastCubeUpdateTime;
	//	
	//	cubeRotation += (20 * delta) / 1000.0;
	//	
	//	cubeXOffset += xIncValue * ((0 * delta) / 1000.0);
	//	cubeYOffset += yIncValue * ((0 * delta) / 1000.0);
	//	cubeZOffset += zIncValue * ((0 * delta) / 1000.0);
	//	
	//	if (Math.abs(cubeYOffset) > 2.5) // this is the bounce when it hits a wall
	//	{
	//		xIncValue = -xIncValue;
	//		yIncValue = -yIncValue;
	//		zIncValue = -zIncValue;
	//	}
	//}
	//
	//lastCubeUpdateTime = currentTime;
}
function initShaders() {
	
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");
	
	// Create the shader program
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert("Unable to initialize the shader program.");
	}
	
	gl.useProgram(shaderProgram);
	
	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(vertexPositionAttribute);
	
	vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(vertexColorAttribute);
	
	textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(textureCoordAttribute);
}
function getShader(gl, id) {
	
	var shaderScript = document.getElementById(id);
	
	// Didn't find an element with the specified ID; abort.
	
	if (!shaderScript) {
		return null;
	}
	
	// Walk through the source element's children, building the
	// shader source string.
	
	var theSource = "";
	var currentChild = shaderScript.firstChild;
	
	while(currentChild) {
		if (currentChild.nodeType == 3) {
			theSource += currentChild.textContent;
		}
		
		currentChild = currentChild.nextSibling;
	}
	
	// Now figure out what type of shader script we have,
	// based on its MIME type.
	
	var shader;
	
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;  // Unknown shader type
	}
	
	// Send the source to the shader object
	
	gl.shaderSource(shader, theSource);
	
	// Compile the shader program
	
	gl.compileShader(shader);
	
	// See if it compiled successfully
	
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
}

