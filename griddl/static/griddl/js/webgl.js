
var canvas;
var gl;

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;
globals.cubeRotation = 0.0;
var lastCubeUpdateTime = 0;

var cubeImage;
var cubeTexture;

var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var textureCoordAttribute;
var perspectiveMatrix;

// set by code in the app
//globals.translation = [0.0, 0.0, -6.0];
//globals.rotation = [0, 1, 0];

function start() {
	canvas = document.getElementById("glcanvas");
	
	gl = null;
	
	try
	{
		gl = canvas.getContext("experimental-webgl");
	}
	catch(e)
	{
		
	}
	
	if (!gl)
	{
		alert("Unable to initialize WebGL. Your browser may not support it.");
	}
	
	if (gl)
	{
		gl.clearColor(0.9, 0.9, 0.9, 1.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
		
		initShaders();
		initBuffers();
		initTextures();
		//setInterval(drawScene, 15);
	}
}
function initBuffers() {
	var vertices = globals.vertices;
	var textureCoordinates = globals.textureCoordinates;
	var cubeVertexIndices = globals.vertexIndices;
	
	cubeVerticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);  
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	cubeVerticesTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
	
	cubeVerticesIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}
function initTextures() {
	cubeTexture = gl.createTexture();
	cubeImage = new Image();
	//cubeImage.onload = function() { handleTextureLoaded(cubeImage, cubeTexture); }
	
	cubeImage.onload = function() {
		//console.log("handleTextureLoaded, image = " + image);
		gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	cubeImage.src = globals.textureSrc; // "/static/webgl/objects/texture.png";
}
function initCanvasTexture() {
	var canvas = $('#texture')[0];
	cubeTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
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
	
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program.");
	}
	
	gl.useProgram(shaderProgram);
	
	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(vertexPositionAttribute);
	
	textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(textureCoordAttribute);
}
function getShader(gl, id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) { return null; }
	
	// Walk through the source element's children, building the shader source string.
	var theSource = "";
	var currentChild = shaderScript.firstChild;
	while(currentChild)
	{
		if (currentChild.nodeType == 3)
		{
			theSource += currentChild.textContent;
		}
		
		currentChild = currentChild.nextSibling;
	}
	
	// Now figure out what type of shader script we have, based on its MIME type.
	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;  // Unknown shader type
	}
	
	gl.shaderSource(shader, theSource); // Send the source to the shader object
	gl.compileShader(shader); // Compile the shader program
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { // See if it compiled successfully
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
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
	mvTranslate(globals.translation);
	mvRotate(globals.cubeRotation, globals.rotation);
	
	
	// Now move the drawing position a bit to where we want to start drawing the cube.
	//mvTranslate([0.0, 0.0, -6.0]); // cube
	//mvTranslate([0.0, 0.0, -6.0]); // top
	//mvTranslate(globals.translation);
	
	// Save the current matrix, then rotate before we draw.
	//mvPushMatrix();
	//mvRotate(globals.cubeRotation, globals.rotation);
	
	// Draw the cube by binding the array buffer to the cube's vertices array, setting attributes, and pushing it to GL.
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	// Set the texture coordinates attribute for the vertices.
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
	gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
	
	// Specify the texture to map onto the faces.
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
	gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
	
	// Draw the cube.
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, globals.vertexIndices.length, gl.UNSIGNED_SHORT, 0);
	
	//mvPopMatrix(); // Restore the original matrix
	
	// Update the rotation for the next draw, if it's time to do so.
	//var currentTime = (new Date).getTime();
	//if (lastCubeUpdateTime)
	//{
	//	var delta = currentTime - lastCubeUpdateTime;
	//	globals.cubeRotation += (30 * delta) / 1000.0;
	//}
	//
	//lastCubeUpdateTime = currentTime;
}

// augment Sylvester some
Matrix.Translation = function (v) {
	if (v.elements.length == 2) {
		var r = Matrix.I(3);
		r.elements[2][0] = v.elements[0];
		r.elements[2][1] = v.elements[1];
		return r;
	}
	
	if (v.elements.length == 3) {
		var r = Matrix.I(4);
		r.elements[0][3] = v.elements[0];
		r.elements[1][3] = v.elements[1];
		r.elements[2][3] = v.elements[2];
		return r;
	}
	
	throw "Invalid length for Translation";
}
Matrix.prototype.flatten = function () {
	var result = [];
	
	if (this.elements.length == 0)
	{
		return [];
	}
	
	for (var j = 0; j < this.elements[0].length; j++)
	{
		for (var i = 0; i < this.elements.length; i++)
		{
			result.push(this.elements[i][j]);
		}
	}
	
	return result;
}
Matrix.prototype.ensure4x4 = function() {
    if (this.elements.length == 4 &&
        this.elements[0].length == 4)
        return this;

    if (this.elements.length > 4 ||
        this.elements[0].length > 4)
        return null;

    for (var i = 0; i < this.elements.length; i++) {
        for (var j = this.elements[i].length; j < 4; j++) {
            if (i == j)
                this.elements[i].push(1);
            else
                this.elements[i].push(0);
        }
    }

    for (var i = this.elements.length; i < 4; i++) {
        if (i == 0)
            this.elements.push([1, 0, 0, 0]);
        else if (i == 1)
            this.elements.push([0, 1, 0, 0]);
        else if (i == 2)
            this.elements.push([0, 0, 1, 0]);
        else if (i == 3)
            this.elements.push([0, 0, 0, 1]);
    }

    return this;
};
Matrix.prototype.make3x3 = function() {
    if (this.elements.length != 4 ||
        this.elements[0].length != 4)
        return null;

    return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                          [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                          [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};
Vector.prototype.flatten = function () {
    return this.elements;
};
function mht(m) {
    var s = "";
    if (m.length == 16) {
        for (var i = 0; i < 4; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*4+0].toFixed(4) + "," + m[i*4+1].toFixed(4) + "," + m[i*4+2].toFixed(4) + "," + m[i*4+3].toFixed(4) + "]</span><br>";
        }
    } else if (m.length == 9) {
        for (var i = 0; i < 3; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*3+0].toFixed(4) + "," + m[i*3+1].toFixed(4) + "," + m[i*3+2].toFixed(4) + "]</font><br>";
        }
    } else {
        return m.toString();
    }
    return s;
}
function makeLookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz) {
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);

    var mag;

    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();

    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    var t = $M([[1, 0, 0, -ex],
                [0, 1, 0, -ey],
                [0, 0, 1, -ez],
                [0, 0, 0, 1]]);
    return m.x(t);
}
function makeOrtho(left, right, bottom, top, znear, zfar) {
	var tx = -(right+left)/(right-left);
	var ty = -(top+bottom)/(top-bottom);
	var tz = -(zfar+znear)/(zfar-znear);
	
	return $M([[2/(right-left), 0, 0, tx],
			[0, 2/(top-bottom), 0, ty],
			[0, 0, -2/(zfar-znear), tz],
			[0, 0, 0, 1]]);
}
function makePerspective(fovy, aspect, znear, zfar) {
	var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
	var ymin = -ymax;
	var xmin = ymin * aspect;
	var xmax = ymax * aspect;
	
	return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}
function makeFrustum(left, right, bottom, top, znear, zfar) {
	var X = 2*znear/(right-left);
	var Y = 2*znear/(top-bottom);
	var A = (right+left)/(right-left);
	var B = (top+bottom)/(top-bottom);
	var C = -(zfar+znear)/(zfar-znear);
	var D = -2*zfar*znear/(zfar-znear);
	
	return $M([[X, 0, A, 0],
			[0, Y, B, 0],
			[0, 0, C, D],
			[0, 0, -1, 0]]);
}

function loadIdentity() { mvMatrix = Matrix.I(4); }
function multMatrix(m) { mvMatrix = mvMatrix.x(m); }
function mvTranslate(v) { multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4()); }
function setMatrixUniforms() {
	var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
	
	var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}
var mvMatrixStack = [];
function mvPushMatrix(m) {
	if (m) {
		mvMatrixStack.push(m.dup());
		mvMatrix = m.dup();
	} else {
		mvMatrixStack.push(mvMatrix.dup());
	}
}
function mvPopMatrix() {
	if (!mvMatrixStack.length) {
		throw("Can't pop from an empty matrix stack.");
	}
	
	mvMatrix = mvMatrixStack.pop();
	return mvMatrix;
}
function mvRotate(angle, v) {
	var inRadians = angle * Math.PI / 180.0;
	
	var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
	multMatrix(m);
}

