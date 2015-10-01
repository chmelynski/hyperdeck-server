
function Main(filename) {

	
	//Cell();
	//BlankThreeJs();
	
	//var textarea = $(document.createElement('textarea'));
	//textarea.css('position', 'absolute');
	//textarea.css('top', '5em');
	//textarea.css('left', '5em');
	//textarea.css('height', '50em');
	//textarea.css('width', '50em');
	//$('body').append(textarea);
}
function Molecule() {
	var renderer = MakeRenderer();
	
	var scene = new THREE.Scene();
	
	var camera = MakeCamera(renderer);
	camera.position.set(100, 0, 0);
	camera.lookAt(new THREE.Vector3(scene.position.x, scene.position.y, scene.position.z));
	scene.add(camera);
	
	var positions = [
		{ r : 10 , color : 0xff0000 , x : 0 , y :  0 , z : 0 } ,
		{ r : 10 , color : 0xff0000 , x : 0 , y : 30 , z : 0 }
	];
	
	var light = new THREE.AmbientLight(0x888888);
	scene.add(light);
	
	var div = $(document.createElement('div'));
	$('body').append(div);
	div.css('position', 'absolute');
	div.css('top', '5em');
	div.css('left', '5em');
	
	var headers = [];
	var colStyles = [];
	
	for (var key in positions[0])
	{
		headers.push(key);
		colStyles.push({ type : 'numeric' , format : '0.0' });
	}
	
	div.handsontable({
		data: positions, // ConvertToHtable(positions),
		rowHeaders: false,
		colHeaders: headers,
		//manualColumnResize: true,
		//manualColumnMove: true,
		contextMenu: true,
		
		afterChange: function(changes, source)
		{
			//debugger;
		},
		
		//columns: colStyles, // this is causing the entries to be blank - not sure why
	});
	
	for (var i = 0; i < positions.length; i++)
	{
		var p = positions[i];
		var geometry = new THREE.SphereGeometry(p.r, 10, 10);
		var material = new THREE.MeshPhongMaterial({ color : p.color });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(p.x, p.y, p.z);
		scene.add(mesh);
	}
	
	RenderLoop(renderer, scene, camera);
}
function ConvertToHtable(objs) {
	var m = [];
	
	var header = [];
	
	for (key in objs[0])
	{
		header.push(key);
	}
	
	m.push(header);
	
	for (var i = 0; i < objs.length; i++)
	{
		var obj = objs[i];
		
		var row = [];
		
		for (key in obj)
		{
			row.push(obj[key]);
		}
		
		m.push(row);
	}
	
	return m;
}
function Cell() {
	// http://www.html5canvastutorials.com/three/html5-canvas-webgl-sphere-with-three-js/
	
	var renderer = MakeRenderer();
	renderer.shadowMapEnabled = true;
	
	var scene = new THREE.Scene();
	
	var camera = MakeCamera(renderer);
	scene.add(camera);
	camera.position.set(250, 200, -100);
	//camera.position.z = 500;
	//camera.lookAt(scene.position);
	camera.lookAt(new THREE.Vector3(scene.position.x, scene.position.y + 100, scene.position.z));
	
	// SKYBOX/FOG
	var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
	var skyBoxMaterial = new THREE.MeshBasicMaterial({ color : 0x9999ff , side : THREE.BackSide });
	var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
	//scene.add(skyBox);
	//scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);
	
	// spotlight #1 -- yellow, dark shadow
	//var spotlight = new THREE.SpotLight(0xffffff);
	//spotlight.position.set(-60, 150, -30);
	////spotlight.shadowCameraVisible = true;
	//spotlight.shadowDarkness = 0.95;
	//spotlight.intensity = 1;
	//spotlight.castShadow = true;
	//scene.add(spotlight);
	
	// spotlight #2 -- red, light shadow
	var spotlight2 = new THREE.SpotLight(0x888888);
	spotlight2.position.set(450, 150, -60);
	//spotlight2.shadowCameraVisible = true;
	spotlight2.shadowDarkness = 0.95;
	spotlight2.intensity = 1;
	spotlight2.castShadow = true;
	scene.add(spotlight2);
	
	// spotlight #3
	var spotlight3 = new THREE.SpotLight(0x0000ff);
	spotlight3.position.set(150, 80, -100);
	//spotlight3.shadowCameraVisible = true;
	spotlight3.shadowDarkness = 0.95;
	spotlight3.intensity = 2;
	spotlight3.castShadow = true;
	scene.add(spotlight3);
	
	// change the direction this spotlight is facing
	var lightTarget = new THREE.Object3D();
	lightTarget.position.set(150, 10, -100);
	scene.add(lightTarget);
	
	spotlight3.target = lightTarget;
	
	var grayTexture = new THREE.ImageUtils.loadTexture('img/grayTexture.png');
	grayTexture.wrapS = THREE.RepeatWrapping;
	grayTexture.wrapT = THREE.RepeatWrapping;
	grayTexture.repeat.set(10, 10);
	
	//shape.overdraw = true; // what does this do?
	
	var barPositions = [
		{ x : 0 , y : 50 , z : -70 } ,
		{ x : 0 , y : 50 , z : -50 } ,
		{ x : 0 , y : 50 , z : -30 } ,
		{ x : 0 , y : 50 , z : -10 } ,
		{ x : 0 , y : 50 , z :  10 } ,
		{ x : 0 , y : 50 , z :  30 } ,
		{ x : 0 , y : 50 , z :  50 } ,
		{ x : 0 , y : 50 , z :  70 }
	];
	
	var crsPositions = [
		{ x : 0 , y :   5 , z : 0 } ,
		{ x : 0 , y :  35 , z : 0 } ,
		{ x : 0 , y :  65 , z : 0 } ,
		{ x : 0 , y :  95 , z : 0 } ,
		{ x : 0 , y : 125 , z : 0 } ,
	];
	
	// var barPosDiv = $(document.createElement('div'));
	// $('body').append(barPosDiv);
	// ConvertToHtable(barPositions).handsontable(barPosDiv[0]);
	
	var barGeometry = new THREE.CylinderGeometry(3, 3, 150, 10, 1, false);
	var barMaterial = new THREE.MeshLambertMaterial({ map : grayTexture });
	
	for (var i = 0; i < barPositions.length; i++)
	{
		var mesh = new THREE.Mesh(barGeometry, barMaterial);
		mesh.position.set(barPositions[i].x, barPositions[i].y, barPositions[i].z);
		mesh.castShadow = true;
		scene.add(mesh);
	}
	
	var crsGeometry = new THREE.CubeGeometry(10, 5, 150);
	var crsMaterial = new THREE.MeshLambertMaterial({ map : grayTexture }); // { color : 0x888888 }
	
	for (var i = 0; i < crsPositions.length; i++)
	{
		var mesh = new THREE.Mesh(crsGeometry, crsMaterial);
		mesh.position.set(crsPositions[i].x, crsPositions[i].y, crsPositions[i].z);
		mesh.castShadow = true;
		scene.add(mesh);
	}
	
	var wallMaterial = new THREE.MeshLambertMaterial({ map : grayTexture , side : THREE.DoubleSide });
	
	var wallGeometry = new THREE.CubeGeometry(200, 130, 10);
	var wall = new THREE.Mesh(wallGeometry, wallMaterial);
	wall.position.set(-90, 65, 80);
	wall.castShadow = true;
	wall.receiveShadow = true;
	scene.add(wall);
	
	var wallGeometry = new THREE.CubeGeometry(200, 130, 10);
	var wall = new THREE.Mesh(wallGeometry, wallMaterial);
	wall.position.set(-90, 65, -70);
	wall.castShadow = true;
	wall.receiveShadow = true;
	scene.add(wall);
	
	var wallGeometry = new THREE.CubeGeometry(10, 130, 160);
	var wall = new THREE.Mesh(wallGeometry, wallMaterial);
	wall.position.set(-190, 65, 0);
	wall.castShadow = true;
	wall.receiveShadow = true;
	scene.add(wall);
	
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
	var floor = new THREE.Mesh(floorGeometry, wallMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	floor.receiveShadow = true;
	scene.add(floor);
	
	// create "light-ball" meshes
	var sphereGeometry = new THREE.SphereGeometry(10, 16, 8);
	var darkMaterial = new THREE.MeshBasicMaterial({ color : 0x000000 });
	
	//var wireframeMaterial = new THREE.MeshBasicMaterial({ color : 0xffff00 , wireframe : true , transparent : true }); 
	//var shape = THREE.SceneUtils.createMultiMaterialObject(sphereGeometry, [ darkMaterial , wireframeMaterial ]);
	//shape.position = spotlight.position;
	//scene.add(shape);
	
	var wireframeMaterial = new THREE.MeshBasicMaterial({ color : 0xff0000 , wireframe : true , transparent : true }); 
	var shape = THREE.SceneUtils.createMultiMaterialObject(sphereGeometry, [ darkMaterial, wireframeMaterial ]);
	shape.position = spotlight2.position;
	scene.add(shape);
	
	var wireframeMaterial = new THREE.MeshBasicMaterial({ color : 0x0000ff , wireframe : true , transparent : true }); 
	var shape = THREE.SceneUtils.createMultiMaterialObject(sphereGeometry, [ darkMaterial , wireframeMaterial ]);
	shape.position = spotlight3.position;
	scene.add(shape);
	
	RenderLoop(renderer, scene, camera);
}
function BlankThreeJs() {
	var renderer = MakeRenderer()
	var scene = new THREE.Scene();
	var camera = MakeCamera(renderer);
	
	scene.add(camera);
	camera.position.set(250, 200, -100);
	var target = scene.position;
	//var target = new THREE.Vector3(scene.position.x, scene.position.y + 100, scene.position.z);
	camera.lookAt(target);
	
	RenderLoop(renderer, scene, camera);
}
function MakeRenderer() {
	var rendererWidth = 600;
	var rendererHeight = 400;
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(rendererWidth, rendererHeight);
	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.top = "200px";
	renderer.domElement.style.left = "750px";
	renderer.domElement.style.border = "1px solid #c3c3c3";
	document.body.appendChild(renderer.domElement);
	return renderer;
}
function MakeCamera(renderer) {
	// var camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
	// var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	
	var viewAngle = 45;
	var aspect = renderer.domElement.width / renderer.domElement.height;
	var near = 0.1;
	var far = 20000;
	var camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
	return camera;
}
function MakeLight() {
	// var light = new THREE.AmbientLight(hex);
	// var light = new THREE.AreaLight(hex, intensity);
	// var light = new THREE.DirectionalLight(hex, intensity);
	// var light = new THREE.HemisphereLight(skyColorHex, groundColorHex, intensity);
	// var light = new THREE.PointLight(hex, intensity, distance);
	// var light = new THREE.SpotLight(hex, intensity, distance, angle, exponent);
	// 
	// hex = 0x404040 = soft white light
	// intensity = 1 = dim
	// 
	// light.position.set(0.0001, 10.0001, -18.5001);
	// light.rotation.set(-0.74719, 0.0001, 0.0001);
	// light.width = 10;
	// light.height = 1;
	// 
	// SpotLight fields:
	// .target				Default position — (0,0,0).	Spotlight focus points at target.position.
	// .intensity			Default — 1.0.				Light's intensity.
	// .distance				Default — 0.0.				If non-zero, light will attenuate linearly from maximum intensity at light position down to zero at distance.
	// .angle				Default — Math.PI/3.		Maximum extent of the spotlight, in radians, from its direction. Should be no more than Math.PI/2.
	// .exponent				Default — 10.0.				Rapidity of the falloff of light from its target direction.
	// .castShadow			Default — false.			If set to true light will cast dynamic shadows. Warning: This is expensive and requires tweaking to get shadows looking right.
	// .onlyShadow			Default — false.			If set to true light will only cast shadow but not contribute any lighting (as if intensity was 0 but cheaper to compute).
	// .shadowCameraNear		Default — 50.				Perspective shadow camera frustum near parameter.
	// .shadowCameraFar		Default — 5000.				Perspective shadow camera frustum far parameter.
	// .shadowCameraFov		Default — 50.				Perspective shadow camera frustum field of view parameter.
	// .shadowCameraVisible	Default — false.			Show debug shadow camera frustum.
	// .shadowBias			Default — 0.				Shadow map bias.
	// .shadowDarkness		Default — 0.5.				Darkness of shadow casted by this light (from 0 to 1).
	// .shadowMapWidth		Default — 512.				Shadow map texture width in pixels.
	// .shadowMapHeight		Default — 512.				Shadow map texture height in pixels.
	// .shadowMatrix			todo
	// .shadowMapSize		todo
	// .shadowCamera			todo
	// .shadowMap			todo
}
function MakeGeometry() {
	// var geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments); (number, number, int, int)
	// var geometry = new THREE.SphereGeometry(radius, segmentsWidth, segmentsHeight); (number, int, int)
	// var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded); (number, number, number, int, int, bool)
	// var geometry = new THREE.CubeGeometry(width, height, depth, widthSegments, heightSegments, depthSegments); (number, number, number, int, int, int)
}
function MakeMaterial() {
	// var material = new THREE.MeshBasicMaterial(parameters);
	// var material = new THREE.MeshDepthMaterial(parameters);
	// var material = new THREE.MeshFaceMaterial(parameters);
	// var material = new THREE.MeshLambertMaterial(parameters);
	// var material = new THREE.MeshNormalMaterial(parameters);
	// var material = new THREE.MeshPhongMaterial(parameters);
	
	// MeshBasicMaterial:
	// color — geometry color in hexadecimal. Default is 0xffffff.
	// wireframe — render geometry as wireframe. Default is false.
	// wireframeLinewidth — Line thickness. Default is 1.
	// wireframeLinecap — Define appearance of line ends. Default is 'round'.
	// wireframeLinejoin — Define appearance of line joints. Default is 'round'.
	// shading — Define shading type. Default is THREE.SmoothShading.  Options are { THREE.SmoothShading THREE.FlatShading THREE.NoShading }
	// vertexColors — Define whether the material uses vertex colors, or not. Default is false.
	// fog — Define whether the material color is affected by global fog settings. Default is true.
	// lightMap — TODO. Default is null.
	// specularMap — TODO. Default is null.
	// envMap — TODO. Default is null.
	// skinning — TODO. Default is false.
	// morphTargets — TODO. Default is false.
}
function MakeBroadway() {
	var renderer = MakeRenderer()
	var scene = new THREE.Scene();
	var camera = MakeCamera(renderer);
	
	scene.add(camera);
	camera.position.set(0, 0, 0);
	camera.lookAt(new THREE.Vector3(0, 50, -100));
	
	var grayTexture = new THREE.ImageUtils.loadTexture('img/grayTexture.png');
	grayTexture.wrapS = THREE.RepeatWrapping;
	grayTexture.wrapT = THREE.RepeatWrapping;
	grayTexture.repeat.set(10, 10);
	
	var nFloors = 1;
	var nSides = 2;
	var nCellsPerRow = 2;
	
	var cellWidth = 100; // z
	var cellDepth = 200; // x
	var cellHeight = 150; // y
	
	var wallThickness = 10;
	
	var catwalkWidth = 50;
	
	var nVertBars = 5;
	var nHoriBars = 4;
	
	var vertBarRadius = 2;
	
	var horiBarHeight = 3;
	var horiBarDepth = 5; // also used for outer frame of grill
	
	var hallRadius = 200;
	
	var vertBarHeight = cellHeight - horiBarHeight - horiBarHeight;
	
	var MakeSide = function(xMult)
	{
		for (var i = 0; i < nFloors; i++)
		{
			MakeRow(xMult, i);
			
			if (i < nFloors - 1)
			{
				MakeCatwalk(xMult, iFloor);
			}
		}
	};
	
	var MakeRow = function(xMult, iFloor)
	{
		for (var i = 0; i < nCellsPerRow; i++)
		{
			MakeCell(xMult, iFloor, iCell);
			
			if (i < nCellsPerRow - 1)
			{
				// far interior wall
			}
		}
	};
	
	var MakeCatwalk = function(xMult, iFloor)
	{
	
	};
	
	var MakeCell = function(xMult, iFloor, iCell)
	{
		// we make the walls here, so that textures can be done here as well
		// (having a monolithic back wall would require composite textures, instead of maintaining textures per cell)
		// back wall
		// near wall
		// far wall
		// ceil
		// floor
		
		MakeGrill(xMult, iFloor, iCell, 0); // near grill (lower z-coord)
		MakeGrill(xMult, iFloor, iCell, 1); // far grill (higher z-coord)
		
		// barred window
		// interior furniture
		// interior light
	};
	
	var MakeGrill = function(xMult, iFloor, iCell, iGrill)
	{
		// near side bar
		// far side bar
		
		for (var i = 0; i < nHoriBars + 2; i++)
		{
			var geometry = new THREE.CubeGeometry(horiBarDepth, horiBarHeight, cellWidth);
			var material = new THREE.MeshLambertMaterial({ map : grayTexture });
			var mesh = new THREE.Mesh(geometry, material);
			var x = xMult * (hallRadius + horiBarDepth / 2);
			var y = (iFloor * 0) + (i * 0) + horiBarHeight / 2;
			var z = (iCell * 0) + (iGrill * 0) + (horiBarHeight + cellWidth / 2); // horiBarHeight is the near vert crossbar
			mesh.position.set(x, y, z);
			mesh.castShadow = true;
			scene.add(mesh);
		}
		
		for (var i = 0; i < nVertBars; i++)
		{
			var geometry = new THREE.CylinderGeometry(vertBarRadius, vertBarRadius, vertBarHeight, 10, 1, false);
			var material = new THREE.MeshPhongMaterial({ color : 0xaaaaaa });
			var mesh = new THREE.Mesh(geometry, material);
			var x = xMult * (hallRadius + horiBarDepth / 2);
			var y = (iFloor * 0) + horiBarHeight + vertBarHeight / 2;
			var z = (iCell * 0) + (iGrill * 0) + (i * 0);
			mesh.position.set(x, y, z);
			mesh.castShadow = true;
			scene.add(mesh);
		}
	};
	
	for (var i = 0; i < nSides; i++)
	{
		MakeSide(i == 0 ? -1 : 1);
	}
	
	// floor
	// ceil or 2 x gables
	
	// front, back walls (these walls need a thickness, to be able to accomodate bars)
	
	// side wall (the non-cell side, if one-sided)
	
	RenderLoop(renderer, scene, camera);
}
function RenderLoop(renderer, scene, camera) {
	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	var animate = function() { requestAnimationFrame(animate); render(); /* update(); */ };
	var render = function() { renderer.render(scene, camera); };
	//var update = function() { if (keyboard.pressed("z")) { /* do something */ } controls.update(); stats.update(); }; // keyboard and stats are undefined
	
	//render();
	setInterval(render, 3000);
	//animate();
}
function SaveThreeJsCanvas() { Canvas2Image.saveAsPNG(document.getElementsByTagName('canvas')[0]); } // this doesn't work.  don't know why

