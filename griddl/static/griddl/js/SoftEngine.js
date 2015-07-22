
var SoftEngine;
(function (SoftEngine) {
	
	SoftEngine.POINT = 0;
	SoftEngine.LINE = 1;
	SoftEngine.POLYGON = 2;
	SoftEngine.renderMode = SoftEngine.LINE;
	var labelVertexes = false;
	
	var scenes = [];
	var devices = [];
	var RedrawAll = function() { 
		for (var i = 0; i < devices.length; i++)
		{
			Render(devices[i], scenes[i]);
		}
	};
	
	var ParseCoordinates = function(str) { var c = str.substr(1, str.length - 2).split(','); return new BABYLON.Vector3(parseFloat(c[0]), parseFloat(c[1]), parseFloat(c[2])); };
	var CoordinatesToString = function(v) { return '('+v.x.toString()+','+v.y.toString()+','+v.z.toString()+')'; };
	var Interpolate = function(min, max, gradient) { return min + (max - min) * Clamp(gradient); };
	var Clamp = function(value, min, max) { var s='undefined'; if(typeof min===s){min=0;} if(typeof max===s){max=1;} return Math.max(min, Math.min(value, max));};
	
	// Device : { workingContext : Canvas , left : float , top : float , workingWidth : float , workingHeight : float , backBuffer : ImageData , depthBuffer : float[] }
	// Scene : { meshes : Mesh[] , camera : Camera , lights : Light[] }
	// Mesh : { vertices : Vertex[] , polygons : Polygon[] , scale : Vector3 , position : Vector3 , rotation : Vector3 }
	// Polygon : { vertices : Vertex[] }
	// Vertex : { Coordinates : Vector3 , Normal : Vector3 , WorldCoordinates : Vector3 , TextureCoordinates : Vector2 }
	// Texture : { width : int , height : int , internalBuffer : ImageData }
	// Camera : { position : Vector3 , target : Vector3 }
	// Light : { position : Vector3 , color : {r,g,b} , intensity : float , name : string }
	
	SoftEngine.DrawFrame = function(g, scene, left, top, width, height) {
		var lightDict = ReadLights('lights');
		var cameraDict = ReadCameras('cameras');
		var geometryDict = ReadGeometries('geometries');
		var meshDict = ReadMeshes('meshes', geometryDict);
		var sceneDict = ReadScenes('scenes', cameraDict, meshDict, lightDict);
		
		var scene = sceneDict[scene];
		var device = new MakeDevice(g, left, top, width, height);
		
		Render(device, scene);
	};
	
	var ProcessScanLine = function(device, data, va, vb, vc, vd, color, texture) {
		var pa = va.Coordinates;
		var pb = vb.Coordinates;
		var pc = vc.Coordinates;
		var pd = vd.Coordinates;
		
		var gradient1 = pa.y != pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
		var gradient2 = pc.y != pd.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;
		
		var sx = Interpolate(pa.x, pb.x, gradient1) >> 0;
		var ex = Interpolate(pc.x, pd.x, gradient2) >> 0;
		var z1 = Interpolate(pa.z, pb.z, gradient1);
		var z2 = Interpolate(pc.z, pd.z, gradient2);
		var snl = Interpolate(data.ndotla, data.ndotlb, gradient1);
		var enl = Interpolate(data.ndotlc, data.ndotld, gradient2);
		var su = Interpolate(data.ua, data.ub, gradient1);
		var eu = Interpolate(data.uc, data.ud, gradient2);
		var sv = Interpolate(data.va, data.vb, gradient1);
		var ev = Interpolate(data.vc, data.vd, gradient2);
		
		for (var x = sx; x < ex; x++)
		{
			var gradient = (x - sx) / (ex - sx);
			
			var z = Interpolate(z1, z2, gradient);
			var ndotl = Interpolate(snl, enl, gradient);
			
			var u = Interpolate(su, eu, gradient);
			var v = Interpolate(sv, ev, gradient);
			
			var textureColor;
			
			if (texture)
			{
				textureColor = texture.map(u, v);
			}
			else
			{
				textureColor = new BABYLON.Color4(1, 1, 1, 1);
			}
			
			//var finalColor = new BABYLON.Color4(color.r * ndotl * textureColor.r, color.g * ndotl * textureColor.g, color.b * ndotl * textureColor.b, 1);
			var finalColor = new BABYLON.Color4(textureColor.r, textureColor.g, textureColor.b, 1);
			
			var y = data.currentY;
			
			if (x >= 0 && y >= 0 && x < device.workingWidth && y < device.workingHeight)
			{
				device.backbufferdata = device.backbuffer.data;
				var index = ((x >> 0) + (y >> 0) * device.workingWidth);
				var index4 = index * 4;
				if (device.depthbuffer[index] < z) { return; }
				device.depthbuffer[index] = z;
				device.backbufferdata[index4 + 0] = finalColor.r * 255;
				device.backbufferdata[index4 + 1] = finalColor.g * 255;
				device.backbufferdata[index4 + 2] = finalColor.b * 255;
				device.backbufferdata[index4 + 3] = finalColor.a * 255;
			}
		}
	};
	var DrawTriangle = function(device, v1, v2, v3, color, texture) {
		
		if (v1.Coordinates.y > v2.Coordinates.y) { var temp = v2; v2 = v1; v1 = temp; }
		if (v2.Coordinates.y > v3.Coordinates.y) { var temp = v2; v2 = v3; v3 = temp; }
		if (v1.Coordinates.y > v2.Coordinates.y) { var temp = v2; v2 = v1; v1 = temp; }
		
		var p1 = v1.Coordinates;
		var p2 = v2.Coordinates;
		var p3 = v3.Coordinates;
		
		var lightPos = new BABYLON.Vector3(0, 10, 10); // change, obviously
		
		var ComputeNDotL = function(vertex, normal, lightPosition) {
			var lightDirection = lightPosition.subtract(vertex);
			normal.normalize();
			lightDirection.normalize();
			return Math.max(0, BABYLON.Vector3.Dot(normal, lightDirection));
		};
		
		var nl1 = ComputeNDotL(v1.WorldCoordinates, v1.Normal, lightPos);
		var nl2 = ComputeNDotL(v2.WorldCoordinates, v2.Normal, lightPos);
		var nl3 = ComputeNDotL(v3.WorldCoordinates, v3.Normal, lightPos);
		
		var data = {};
		
		var dP1P2;
		var dP1P3;
		
		if (p2.y - p1.y > 0) { dP1P2 = (p2.x - p1.x) / (p2.y - p1.y); } else { dP1P2 = 0; }
		if (p3.y - p1.y > 0) { dP1P3 = (p3.x - p1.x) / (p3.y - p1.y); } else { dP1P3 = 0; }
		
		if (dP1P2 > dP1P3)
		{
			for (var y = p1.y >> 0; y <= p3.y >> 0; y++)
			{
				data.currentY = y;
				
				if (y < p2.y)
				{
					data.ndotla = nl1;
					data.ndotlb = nl3;
					data.ndotlc = nl1;
					data.ndotld = nl2;
					
					data.ua = v1.TextureCoordinates.x;
					data.ub = v3.TextureCoordinates.x;
					data.uc = v1.TextureCoordinates.x;
					data.ud = v2.TextureCoordinates.x;
					
					data.va = v1.TextureCoordinates.y;
					data.vb = v3.TextureCoordinates.y;
					data.vc = v1.TextureCoordinates.y;
					data.vd = v2.TextureCoordinates.y;
					
					ProcessScanLine(device, data, v1, v3, v1, v2, color, texture);
				}
				else
				{
					data.ndotla = nl1;
					data.ndotlb = nl3;
					data.ndotlc = nl2;
					data.ndotld = nl3;
					
					data.ua = v1.TextureCoordinates.x;
					data.ub = v3.TextureCoordinates.x;
					data.uc = v2.TextureCoordinates.x;
					data.ud = v3.TextureCoordinates.x;
					
					data.va = v1.TextureCoordinates.y;
					data.vb = v3.TextureCoordinates.y;
					data.vc = v2.TextureCoordinates.y;
					data.vd = v3.TextureCoordinates.y;
					
					ProcessScanLine(device, data, v1, v3, v2, v3, color, texture);
				}
			}
		}
		else
		{
			for (var y = p1.y >> 0; y <= p3.y >> 0; y++)
			{
				data.currentY = y;
				
				if (y < p2.y)
				{
					data.ndotla = nl1;
					data.ndotlb = nl2;
					data.ndotlc = nl1;
					data.ndotld = nl3;
					
					data.ua = v1.TextureCoordinates.x;
					data.ub = v2.TextureCoordinates.x;
					data.uc = v1.TextureCoordinates.x;
					data.ud = v3.TextureCoordinates.x;
					
					data.va = v1.TextureCoordinates.y;
					data.vb = v2.TextureCoordinates.y;
					data.vc = v1.TextureCoordinates.y;
					data.vd = v3.TextureCoordinates.y;
					
					ProcessScanLine(device, data, v1, v2, v1, v3, color, texture);
				}
				else
				{
					data.ndotla = nl2;
					data.ndotlb = nl3;
					data.ndotlc = nl1;
					data.ndotld = nl3;
					
					data.ua = v2.TextureCoordinates.x;
					data.ub = v3.TextureCoordinates.x;
					data.uc = v1.TextureCoordinates.x;
					data.ud = v3.TextureCoordinates.x;
					
					data.va = v2.TextureCoordinates.y;
					data.vb = v3.TextureCoordinates.y;
					data.vc = v1.TextureCoordinates.y;
					data.vd = v3.TextureCoordinates.y;
					
					ProcessScanLine(device, data, v2, v3, v1, v3, color, texture);
				}
			}
		}
	};
	var Project = function(device, vertex, transformMatrix, worldMatrix) {
		
		var point2d = BABYLON.Vector3.TransformCoordinates(vertex.Coordinates, transformMatrix);
		var point3DWorld = BABYLON.Vector3.TransformCoordinates(vertex.Coordinates, worldMatrix);
		var normal3DWorld = BABYLON.Vector3.TransformCoordinates(vertex.Normal, worldMatrix);
		
		var x = point2d.x * device.workingWidth + device.workingWidth / 2.0;
		var y = -point2d.y * device.workingHeight + device.workingHeight / 2.0;
		
		return ({
			Coordinates: new BABYLON.Vector3(x, y, point2d.z),
			Normal: normal3DWorld,
			WorldCoordinates: point3DWorld,
			TextureCoordinates: vertex.TextureCoordinates
			//TextureCoordinates: {}
		});
	};
	var LabelVertexes = function(device, vertexes, transformMatrix, worldMatrix) {
		
		var projectedVertexes = vertexes.map(function(elt, index) { return Project(device, elt, transformMatrix, worldMatrix); });
		
		var right = device.left + device.workingWidth;
		var bottom = device.top + device.workingHeight;
		
		for (var i = 0; i < projectedVertexes.length; i++)
		{
			var x = device.left + projectedVertexes[i].Coordinates.x;
			var y = device.top + projectedVertexes[i].Coordinates.y;
			
			if (x <= device.left || y <= device.top || x >= right || y >= bottom) { continue; } 
			
			device.workingContext.fillText(vertexes[i].ToString(), x, y); // 1. vertexes need a toString function   2. where does g come from?
		}
	};
	var DrawLinePolygon = function(device, vertexes, transformMatrix, worldMatrix) {
		
		var projectedVertexes = vertexes.map(function(elt, index) { return Project(device, elt, transformMatrix, worldMatrix); });
		
		var right = device.left + device.workingWidth;
		var bottom = device.top + device.workingHeight;
		
		for (var i = 0; i < vertexes.length; i++)
		{
			var a = i;
			var b = (i + 1) % vertexes.length;
			var x1 = device.left + projectedVertexes[a].Coordinates.x;
			var y1 = device.top + projectedVertexes[a].Coordinates.y;
			var x2 = device.left + projectedVertexes[b].Coordinates.x;
			var y2 = device.top + projectedVertexes[b].Coordinates.y;
			
			var inplay1 = (device.left < x1 - 1) && (x1 < right) && (device.top < y1 - 1) && (y1 < bottom); // this -1 correction is frustrating - before i added it, dots were being drawn on the edge of the in-play area of the canvas and then were not being erased by clearRect.  no idea why
			var inplay2 = (device.left < x2 - 1) && (x2 < right) && (device.top < y2 - 1) && (y2 < bottom);
			if (!inplay1 || !inplay2) { continue; } // this is too aggressive - we could display part of the lines by clamping the points to the visible window
			// but the calculations are nontrivial - you could have one point in play and one not, or both points could be out of play but part of the line between them is still visible
			// there's no easy way to determine whether to clamp or just to discard the line
			// if we were purely staying in canvas, we could use transformations and clipping regions and not have to have any of this code
			// but then we lose compatibility with PDF
			
			device.workingContext.drawLine(x1, y1, x2, y2);
			
			if (vertexes.length == 2) { break; }
		}
		
		// this is an attempt at drawing polygons filled with white so that there is proper occlusion
		// it is horrendously slow and the lines are dark from presumably being drawn over twice (but why doesn't the above code do the same?)
		// also, to do this correctly we need a depth buffer and we must draw the polygons in the correct order
		//var g = device.workingContext;
		//
		//for (var i = 0; i < projectedVertexes.length; i++)
		//{
		//	var x = device.left + projectedVertexes[i].Coordinates.x;
		//	var y = device.top + projectedVertexes[i].Coordinates.y;
		//	
		//	if (i == 0)
		//	{
		//		g.moveTo(x, y);
		//	}
		//	else
		//	{
		//		g.lineTo(x, y);
		//	}
		//}
		//
		//if (projectedVertexes > 2) { g.closePath(); }
		//g.fillStyle = 'rgb(255,255,255)';
		//g.fill();
		//g.stroke();
	};
	var DrawPoints = function(device, vertexes, transformMatrix, worldMatrix) {
		
		var projectedVertexes = vertexes.map(function(elt, index) { return Project(device, elt, transformMatrix, worldMatrix); });
		
		device.workingContext.fillStyle = 'rgb(0,0,0)';
		for (var i = 0; i < projectedVertexes.length; i++)
		{
			device.workingContext.fillCircle(device.left + projectedVertexes[i].Coordinates.x, device.top + projectedVertexes[i].Coordinates.y, 2);
		}
	};
	var Render = function(device, scene) {
		
		var camera = scene.camera;
		var meshes = scene.meshes;
		
		device.workingContext.clearRect(device.left, device.top, device.workingWidth, device.workingHeight);
		
		if (SoftEngine.renderMode == SoftEngine.POLYGON)
		{
			// this fails for SVG, because GriddlCanvas.getImageData passes through to CanvasRenderingContext2D.getImageData
			// maybe we should create a separate canvas for the render, and then convert to base64 and draw it on the page as an image?
			device.backbuffer = device.workingContext.getImageData(device.left, device.top, device.workingWidth, device.workingHeight);
			for (var i = 0; i < device.depthbuffer.length; i++) { device.depthbuffer[i] = 10000000; }
		}
		
		var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
		var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, device.workingWidth / device.workingHeight, 0.01, 1.0);
		
		var polyfaces = { 3 : [[0, 1, 2]], 4 : [[0, 1, 2], [0, 2, 3]], 5 : [] };
		
		for (var i = 0; i < meshes.length; i++)
		{
			var mesh = meshes[i];
			
			var scaleMatrix = BABYLON.Matrix.Scaling(mesh.scale.x, mesh.scale.y, mesh.scale.z);
			var rotationMatrix = BABYLON.Matrix.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
			var translationMatrix = BABYLON.Matrix.Translation(mesh.position.x, mesh.position.y, mesh.position.z);
			var worldMatrix = scaleMatrix.multiply(rotationMatrix).multiply(translationMatrix);
			var worldView = worldMatrix.multiply(viewMatrix);
			var transformMatrix = worldView.multiply(projectionMatrix);
			
			if (SoftEngine.renderMode == SoftEngine.POINT)
			{
				DrawPoints(device, mesh.vertices, transformMatrix, worldMatrix);
			}
			else 
			{
				for (var j = 0; j < mesh.polygons.length; j++)
				{
					var poly = mesh.polygons[j];
					
					if (SoftEngine.renderMode == SoftEngine.LINE)
					{
						DrawLinePolygon(device, poly.vertices, transformMatrix, worldMatrix);
						
						if (labelVertexes)
						{
							LabelVertexes(device, poly.vertices, transformMatrix, worldMatrix);
						}
					}
					else if (SoftEngine.renderMode == SoftEngine.POLYGON)
					{
						if (!poly.Normal)
						{
							var a = poly.vertices[0];
							var b = poly.vertices[1];
							var c = poly.vertices[2];
							var ab = new BABYLON.Vector3(b.Coordinates.x - a.Coordinates.x, b.Coordinates.y - a.Coordinates.y, b.Coordinates.z - a.Coordinates.z);
							var ac = new BABYLON.Vector3(c.Coordinates.x - a.Coordinates.x, c.Coordinates.y - a.Coordinates.y, c.Coordinates.z - a.Coordinates.z);
							// it appears that the vertices are ordered such that this cross product vector points outward from the mesh, like we want
							var cross = BABYLON.Vector3.Cross(ab, ac);
							cross.normalize();
							poly.Normal = cross;
						}
						
						var transformedNormal = BABYLON.Vector3.TransformNormal(poly.Normal, worldView);
						//if (transformedNormal.z >= 0) { continue; }
						
						var relevantPolyfaces = polyfaces[poly.vertices.length];
						
						for (var k = 0; k < relevantPolyfaces.length; k++)
						{
							var a = relevantPolyfaces[k][0];
							var b = relevantPolyfaces[k][1];
							var c = relevantPolyfaces[k][2];
							
							var vertexA = poly.vertices[a];
							var vertexB = poly.vertices[b];
							var vertexC = poly.vertices[c];
							
							var pixelA = Project(device, vertexA, transformMatrix, worldMatrix);
							var pixelB = Project(device, vertexB, transformMatrix, worldMatrix);
							var pixelC = Project(device, vertexC, transformMatrix, worldMatrix);
							
							if (poly.uvs)
							{
								pixelA.TextureCoordinates = poly.uvs[a];
								pixelA.TextureCoordinates = poly.uvs[b];
								pixelA.TextureCoordinates = poly.uvs[c];
							}
							
							//pixelA.TextureCoordinates.x = poly.uvs[a].u;
							//pixelA.TextureCoordinates.y = 1.0 - poly.uvs[a].v;
							//pixelB.TextureCoordinates.x = poly.uvs[b].u;
							//pixelB.TextureCoordinates.y = 1.0 - poly.uvs[b].v;
							//pixelC.TextureCoordinates.x = poly.uvs[c].u;
							//pixelC.TextureCoordinates.y = 1.0 - poly.uvs[c].v;
							
							var color = 1.0;
							DrawTriangle(device, pixelA, pixelB, pixelC, new BABYLON.Color4(color, color, color, 1), mesh.texture);
						}
					}
				}
			}
		}
		
		if (SoftEngine.renderMode == SoftEngine.POLYGON)
		{
			device.workingContext.putImageData(device.backbuffer, device.left, device.top);
		}
	};
	
	
	var geometryFunctions = {};
	geometryFunctions.Cube = function() {
		
		var geometry = new SoftEngine.Mesh(null, 8, 6);
		
		var vertexArray = [
			[-0.5,0,-0.5],
			[-0.5,1,-0.5],
			[-0.5,0,+0.5],
			[-0.5,1,+0.5],
			[+0.5,0,-0.5],
			[+0.5,1,-0.5],
			[+0.5,0,+0.5],
			[+0.5,1,+0.5]];
			
		var polygonArray = [
			[0,1,3,2],
			[4,5,7,6],
			[0,1,5,4],
			[2,3,7,6],
			[0,2,6,4],
			[1,3,7,5]];
		
		for (var i = 0; i < vertexArray.length; i++)
		{
			var vertex = {};
			vertex.Coordinates = {x:vertexArray[i][0],y:vertexArray[i][1],z:vertexArray[i][2]};
			vertex.Normal = new BABYLON.Vector3(0, 0, 0);
			geometry.vertices[i] = vertex;
		}
		
		for (var i = 0; i < polygonArray.length; i++)
		{
			var polygon = {};
			polygon.vertices = [];
			polygon.vertices.push(geometry.vertices[polygonArray[i][0]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][1]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][2]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][3]]);
			geometry.polygons[i] = polygon;
		}
		
		return geometry;
	};
	geometryFunctions.Cylinder = function(segments) {
		
		// the length of the cylinder is along the y axis, and the circular part is x-z
		// the cylinder goes from y=0 to y=1, and the radius is 1
		
		var geometry = new SoftEngine.Mesh(null, segments * 2 + 2, segments * 3);
		
		// the two center points at top and bottom
		geometry.vertices[0] = { Coordinates : {x:0,y:0,z:0} , Normal : new BABYLON.Vector3(0, 0, 0) };
		geometry.vertices[1] = { Coordinates : {x:0,y:1,z:0} , Normal : new BABYLON.Vector3(0, 0, 0) };
		
		for (var y = 0; y < 2; y++)
		{
			for (var i = 0; i < segments; i++)
			{
				var angle = i / segments;
				
				var vertex = {};
				vertex.Coordinates = {x:Math.cos(angle * 2 * Math.PI),y:y,z:Math.sin(angle * 2 * Math.PI)};
				vertex.Normal = new BABYLON.Vector3(0, 0, 0);
				geometry.vertices[2 + y * segments + i] = vertex;
			}
		}
		
		// the triangles around the top and bottom - spokes radiating out from the center
		for (var y = 0; y < 2; y++)
		{
			for (var i = 0; i < segments; i++)
			{
				var a = (i + 0) % segments;
				var b = (i + 1) % segments;
				
				var polygon = {};
				polygon.vertices = [];
				polygon.vertices.push(geometry.vertices[y]);
				polygon.vertices.push(geometry.vertices[2 + y * segments + a]);
				polygon.vertices.push(geometry.vertices[2 + y * segments + b]);
				geometry.polygons[y * segments + i] = polygon;
			}
		}
		
		// the rectangles along the sides
		for (var i = 0; i < segments; i++)
		{
			var a = (i + 0) % segments;
			var b = (i + 1) % segments;
			
			var polygon = {};
			polygon.vertices = [];
			polygon.vertices.push(geometry.vertices[2 + 0 * segments + a]);
			polygon.vertices.push(geometry.vertices[2 + 0 * segments + b]);
			polygon.vertices.push(geometry.vertices[2 + 1 * segments + b]);
			polygon.vertices.push(geometry.vertices[2 + 1 * segments + a]);
			geometry.polygons[2 * segments + i] = polygon;
		}
		
		return geometry;
	};
	geometryFunctions.Chainlink = function(hr, wr, radius, largeSegments, smallSegments) {
		//var cylinder = geometryFunctions.Cylinder(smallSegments);
		// make two copies for top and bottom straight parts
	};
	geometryFunctions.Torus = function(largeRadius, smallRadius, largeSegments, smallSegments) {
		
		// height = y
		// width = x;
		// depth = z
		
		var geometry = new SoftEngine.Mesh(null, largeSegments * smallSegments, largeSegments * smallSegments);
		
		for (var i = 0; i < largeSegments; i++)
		{
			for (var k = 0; k < smallSegments; k++)
			{
				// assume the center of the torus is (0,0,0)
				
				var largeAngleTurns = i / largeSegments;
				var smallAngleTurns = k / smallSegments;
				
				var pointRadius = largeRadius + smallRadius * Math.cos(smallAngleTurns * 2 * Math.PI);
				
				var vertex = {};
				var x = pointRadius * Math.cos(largeAngleTurns * 2 * Math.PI);
				var y = pointRadius * Math.sin(largeAngleTurns * 2 * Math.PI);
				var z = smallRadius * Math.sin(smallAngleTurns * 2 * Math.PI);
				vertex.Coordinates = {x:x,y:y,z:z};
				vertex.Normal = new BABYLON.Vector3(0, 0, 0);
				geometry.vertices[i * smallSegments + k] = vertex;
			}
		}
		
		for (var i = 0; i < largeSegments; i++)
		{
			for (var k = 0; k < smallSegments; k++)
			{
				var polygon = {};
				polygon.vertices = [];
				
				var ai = (i + 0) % largeSegments;
				var ak = (k + 0) % smallSegments;
				var bi = (i + 0) % largeSegments;
				var bk = (k + 1) % smallSegments;
				var ci = (i + 1) % largeSegments;
				var ck = (k + 0) % smallSegments;
				var di = (i + 1) % largeSegments;
				var dk = (k + 1) % smallSegments;
				
				var a = ai * smallSegments + ak;
				var b = bi * smallSegments + bk;
				var c = ci * smallSegments + ck;
				var d = di * smallSegments + dk;
				
				polygon.vertices.push(geometry.vertices[a]);
				polygon.vertices.push(geometry.vertices[b]);
				polygon.vertices.push(geometry.vertices[d]);
				polygon.vertices.push(geometry.vertices[c]);
				
				geometry.polygons[i * smallSegments + k] = polygon;
			}
		}
		
		return geometry;
	};
	geometryFunctions.SquareChainlink = function(x, y, z) {
		
		var geometry = new SoftEngine.Mesh(null, 24, 16);
		
		var vertexArray = [
			[+x+z,+y+z,+z],
			[+x+z,+y+z,-z],
			[+x+z,-y-z,+z],
			[+x+z,-y-z,-z],
			[-x-z,+y+z,+z],
			[-x-z,+y+z,-z],
			[-x-z,-y-z,+z],
			[-x-z,-y-z,-z],
			[+x-z,+y-z,+z],
			[+x-z,+y-z,-z],
			[+x-z,-y+z,+z],
			[+x-z,-y+z,-z],
			[-x+z,+y-z,+z],
			[-x+z,+y-z,-z],
			[-x+z,-y+z,+z],
			[-x+z,-y+z,-z],
			[+x+z,+y-z,+z],
			[+x+z,+y-z,-z],
			[+x+z,-y+z,+z],
			[+x+z,-y+z,-z],
			[-x-z,+y-z,+z],
			[-x-z,+y-z,-z],
			[-x-z,-y+z,+z],
			[-x-z,-y+z,-z]];
			
		var polygonArray = [
			[0,2,3,1],
			[4,5,7,6],
			[8,9,10,11],
			[12,14,15,13],
			[0,1,5,4],
			[2,6,7,3],
			[8,12,13,9],
			[10,11,15,14],
			[0,4,20,16],
			[8,10,18,16],
			[20,22,14,12],
			[22,6,2,18],
			[1,17,21,5],
			[17,19,11,9],
			[13,15,23,21],
			[19,3,7,23]];
		
		for (var i = 0; i < vertexArray.length; i++)
		{
			var vertex = {};
			vertex.Coordinates = {x:vertexArray[i][0],y:vertexArray[i][1],z:vertexArray[i][2]};
			vertex.Normal = new BABYLON.Vector3(0, 0, 0);
			geometry.vertices[i] = vertex;
		}
		
		for (var i = 0; i < polygonArray.length; i++)
		{
			var polygon = {};
			polygon.vertices = [];
			polygon.vertices.push(geometry.vertices[polygonArray[i][0]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][1]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][2]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][3]]);
			geometry.polygons[i] = polygon;
		}
		
		return geometry;
	};
	geometryFunctions.Coil = function(length, samplesPerUnitLength) {
		
		var vertices = [];
		var polygons = [];
		
		var barbVertices = [];
		var barbPolygons = [];
		var baseVertices = []
		
		var unitLongitude = 1.0;
		var barbHeight = 0.07;
		var barbPointy = 0.1;
		var longitudinalJitter = 0.6;
		var coilRadius = 1.0;
		var coilRadiusJitter = 0.02;
		var coilRadiusCorrection = 0.01;
		
		var c = 0;
		var longitude = 0;
		var radius = coilRadius;
		
		for (var i = 0; i < length; i++)
		{
			var longitudeOfCurrentCoil = unitLongitude + Math.random() * 2 * longitudinalJitter - longitudinalJitter;
			var longitudinalIncrement = longitudeOfCurrentCoil / samplesPerUnitLength;
			
			// the longitude is now incremental, but the coilradius is not, which means there can be radius kinks between coils
			// somehow we want the coil radius to vary smoothly
			
			for (var j = 0; j < samplesPerUnitLength; j++)
			{
				var turns = i + j / samplesPerUnitLength;
				var radians = turns * Math.PI * 2;
				
				longitude += longitudinalIncrement;
				radius += Math.random() * 2 * coilRadiusJitter - coilRadiusJitter;
				if (radius > coilRadius) { radius -= coilRadiusCorrection; } else { radius += coilRadiusCorrection; }
				
				//var vertex = {};
				//vertex.Coordinates = {x:turns,y:Math.cos(radians),z:Math.sin(radians)};
				//vertex.Normal = new BABYLON.Vector3(0, 0, 0);
				//geometry.vertices[i * samplesPerUnitLength + j] = vertex;
				
				//centerpoints.push({x:turns,y:Math.cos(radians),z:Math.sin(radians)})
				
				var centerpoint = new BABYLON.Vector3(longitude, radius * Math.cos(radians), radius * Math.sin(radians));
				
				// point-by-point random jitter leads to kinky wires - i think jitter should be added the angle/x-coord level
				//var jitter = new BABYLON.Vector3(Math.random() * jitterStrength, Math.random() * jitterStrength, Math.random() * jitterStrength);
				//centerpoint = centerpoint.add(jitter);
				
				var tangent = new BABYLON.Vector3(1, -Math.sin(radians), Math.cos(radians));
				tangent.normalize();
				var normal = new BABYLON.Vector3(0, -Math.cos(radians), -Math.sin(radians));
				normal.normalize();
				var binormal = BABYLON.Vector3.Cross(tangent, normal);
				
				var wireRadius = 0.02;
				
				for (var k = 0; k < 6; k++)
				{
					var phi = k / 6 * Math.PI * 2;
					
					var point = centerpoint.add(normal.scale(Math.cos(phi)).scale(wireRadius)).add(binormal.scale(Math.sin(phi)).scale(wireRadius));
					
					var vertex = {};
					vertex.Coordinates = point;
					vertex.Normal = new BABYLON.Vector3(0, 0, 0);
					vertices.push(vertex);
					
					// double-sided barbs
					//var barbVertex = {};
					//if ((c % 4) == 0)
					//{
					//	barbVertex.Coordinates = point.add(normal.scale(barbHeight)).add(tangent.scale(-barbPointy));
					//}
					//else
					//{
					//	barbVertex.Coordinates = point.add(normal.scale(barbHeight)).add(tangent.scale(barbPointy));
					//}
					//barbVertex.Normal = new BABYLON.Vector3(0, 0, 0);
					//barbVertices.push(barbVertex);
					//baseVertices.push(vertex);
					
					// barbs that alternate sides
					if ((c % 4) == 0 || (c % 4) == 1)
					{
						if (k == 0)
						{
							var barbVertex = {};
							if ((c % 4) == 0)
							{
								barbVertex.Coordinates = point.add(normal.scale(barbHeight)).add(tangent.scale(-barbPointy));
							}
							else
							{
								barbVertex.Coordinates = point.add(normal.scale(barbHeight)).add(tangent.scale(barbPointy));
							}
							barbVertex.Normal = new BABYLON.Vector3(0, 0, 0);
							barbVertices.push(barbVertex);
							baseVertices.push(vertex);
						}
					}
					else
					{
						if (k == 3)
						{
							var barbVertex = {};
							if ((c % 4) == 2)
							{
								barbVertex.Coordinates = point.add(normal.scale(-barbHeight)).add(tangent.scale(-barbPointy));
							}
							else
							{
								barbVertex.Coordinates = point.add(normal.scale(-barbHeight)).add(tangent.scale(barbPointy));
							}
							barbVertex.Normal = new BABYLON.Vector3(0, 0, 0);
							barbVertices.push(barbVertex);
							baseVertices.push(vertex);
						}
					}
				}
				
				c++;
			}
		}
		
		for (var i = 0; i < barbVertices.length; i += 2)
		{
			var barbPolygon = {};
			barbPolygon.vertices = [];
			barbPolygon.vertices.push(barbVertices[i + 0]);
			barbPolygon.vertices.push(baseVertices[i + 0]);
			barbPolygon.vertices.push(baseVertices[i + 1]);
			barbPolygon.vertices.push(barbVertices[i + 1]);
			barbPolygons.push(barbPolygon);
		}
		
		for (var i = 0; i < length * samplesPerUnitLength - 1; i++)
		{
			for (var k = 0; k < 6; k++)
			{
				var polygon = {};
				polygon.vertices = [];
				polygon.vertices.push(vertices[(i + 0) * 6 + ((k + 0) % 6)]);
				polygon.vertices.push(vertices[(i + 0) * 6 + ((k + 1) % 6)]);
				polygon.vertices.push(vertices[(i + 1) * 6 + ((k + 1) % 6)]);
				polygon.vertices.push(vertices[(i + 1) * 6 + ((k + 0) % 6)]);
				polygons.push(polygon);
			}
		}
		
		var geometry = new SoftEngine.Mesh(null, vertices.length, polygons.length);
		geometry.vertices = vertices.concat(barbVertices);
		geometry.polygons = polygons.concat(barbPolygons);
		return geometry;
	};
	geometryFunctions.Sphere = function(nHemiLatitudeLines, nHemiLongitudeLines) {
		
		var lats = nHemiLatitudeLines * 2 + 1;
		var longs = nHemiLongitudeLines * 2;
		
		var vertices = 2 + lats * longs;
		
		var radius = 1;
		
		var polygons = [];
		var points = [];
		var northPole = {Coordinates:{x:0,z:0,y:+radius},Normal:new BABYLON.Vector3(0, 0, 0)};
		var southPole = {Coordinates:{x:0,z:0,y:-radius},Normal:new BABYLON.Vector3(0, 0, 0)};
		points.push(northPole);
		points.push(southPole);
		
		var pointMatrix = {};
		for (var i = -nHemiLatitudeLines; i <= nHemiLatitudeLines; i++) { pointMatrix[i] = []; }
		
		// points on the equator
		for (var j = 0; j < longs; j++)
		{
			var theta = j / longs * Math.PI * 2;
			var x = Math.cos(theta);
			var z = Math.sin(theta);
			var vertex = {};
			vertex.Coordinates = {x:x,z:z,y:0};
			vertex.Normal = new BABYLON.Vector3(0, 0, 0);
			points.push(vertex);
			pointMatrix[0].push(vertex);
		}
		
		for (var i = 1; i <= nHemiLatitudeLines; i++)
		{
			for (var k = -1; k <= 1; k += 2) // north or south latitude
			{
				for (var j = 0; j < longs; j++)
				{
					var theta = j / longs * Math.PI * 2;
					var phi = i / (nHemiLatitudeLines + 1) * k * Math.PI / 2; // 1/2 or 1/3,2/3 or 1/4,2/4,3/4, etc.
					
					var x = radius * Math.cos(theta) * Math.cos(phi);
					var z = radius * Math.sin(theta) * Math.cos(phi);
					var y = radius * Math.sin(phi);
					var vertex = {};
					vertex.Coordinates = {x:x,z:z,y:y};
					vertex.Normal = new BABYLON.Vector3(0, 0, 0);
					points.push(vertex);
					pointMatrix[i * k].push(vertex);
				}
			}
		}
		
		for (var i = -nHemiLatitudeLines; i <= nHemiLatitudeLines; i++)
		{
			for (var j = 0; j < pointMatrix[i].length; j++)
			{
				// latitude segments
				var polygon = {};
				polygon.vertices = [];
				polygon.vertices.push(pointMatrix[i][j]);
				polygon.vertices.push(pointMatrix[i][(j+1) % pointMatrix[i].length]);
				polygons.push(polygon);
				
				// longitude segments - a point connects with the point to its north
				var polygon = {};
				polygon.vertices = [];
				polygon.vertices.push(pointMatrix[i][j]);
				
				if (!pointMatrix[i + 1])
				{
					polygon.vertices.push(northPole);
				}
				else
				{
					polygon.vertices.push(pointMatrix[i+1][j]);
				}
				
				polygons.push(polygon);
			}
		}
		
		// now connect the south pole to the lowest points
		for (var j = 0; j < longs; j++)
		{
			var polygon = {};
			polygon.vertices = [];
			polygon.vertices.push(southPole);
			polygon.vertices.push(pointMatrix[-nHemiLatitudeLines][j]);
			polygons.push(polygon);
		}
		
		var geometry = new SoftEngine.Mesh(null, points.length, polygons.length);
		
		geometry.vertices = points;
		geometry.polygons = polygons;
		
		return geometry;
	};
	
	// circle : { radius : float , normal : {x,y,z} , center : {x,y,z} }
	// ellipse : { cx : float , cy : float , majorAxis : float , minorAxis : float , rotation : radians }
	// box : { center : {x,y,z} , u : {x,y,z} , v : {x,y,z} }
	// ProjectCircle : circle -> ellipse
	// drawBox : box -> 'M 0 0 L 0 0 L 0 0 L 0 0 z'
	// circleFromBox : circle -> box
	
	SoftEngine.ProjectCircle = function(circle) {
		
		// This function assumes that z is the depth direction, that the projection plane is at distance z=1 and that observer is in the point (0,0,0).
		
		var r = circle.radius;
		var n = circle.normal;
		var c = circle.center;
		
		// Let (u,v) be a point of the Ellipse.
		// Which point of the circle it represents?
		// This 3-D point must have a form of (u*z,v*z,z) for some z,
		// bacause it lays on a ray from observer (0,0,0) through (u,v,1) on the screen.
		// A circle is an intersection of a plane with a sphere.
		// So we have two conditions for our point :
		// 1) it has to belong to the plane given by the center and normal of the circle:
		// (u*z-c.x)*n.x+  (v*z-c.y)*n.y + (z-c.z)*n.z = 0
		// 2) it has to belong to the sphere given by the center and radius
		// (u*z-c.x)^2  +  (v*z-c.y)^2   + (z-c.z)^2   = 0
		// The first equation alows us to express z in terms of u,v and constants:
		// z =   (c.x*n.x+c.y*n.y+c.z*n.z) / (u*n.x+v*n.y+n.z) 
		//       ^^^^^^^^^^^^ s ^^^^^^^^^    ^^^^^ t(u,v) ^^^^
		var s = c.x * n.x + c.y * n.y + c.z * n.z;
		
		// t(u,v) = u * n.x + v * n.y + n.z
		// The second equation gives us:
		// zz(uu + vv + 1) - 2z(u * c.x + v * c.y + z * c.z) + c.x^2 + c.y^2 + c.z^2 - r^2 = 0
		//                                   ^^^^^^^^^ H ^^^^^^^^^
		var H = c.x * c.x + c.y * c.y + c.z * c.z - r * r;
		
		// Recall however, that z has u and v in denominator which makes it hard to solve/simplify.
		// But z = s/t(u,v), so let us multiply both sides by t(u,v)^2 :
		// ss * (uu + vv + 1) - 2 * s * t(u,v) * (u * c.x + v * c.y + c.z) + t(u,v)^2 * H=0
		// ss * uu + ss * vv + ss - 2 * s * (u * n.x + v * n.y + n.z) * (u * c.x + v * c.y + c.z) + (u * n.x + v * n.y + n.z) * (u * n.x + v * n.y + n.z) * H=0 
		// By regrouping terms so as to match the ax^2 + 2bxy + cy^2 + 2dx + 2fy + g = 0 formula, we get:
		var A = s * s + H * n.x * n.x - 2 * s * n.x * c.x;
		var B = H * n.x * n.y - s * n.x * c.y - s * n.y * c.x;
		var C = s * s + H * n.y * n.y - 2 * s * n.y * c.y;
		var D = H * n.x * n.z - s * n.x * c.z - s * n.z * c.x;
		var F = H * n.y * n.z - s * n.y * c.z - s * n.z * c.y;
		var G = s * s + H * n.z * n.z - 2 * s * n.z * c.z;
		
		// ellipse equation: a*x^2 + 2*b*x*y + c*y^2 + 2*d*x + 2*f*y + g = 0
		// See http://mathworld.wolfram.com/Ellipse.html for the equations for center/radius/rotation ('e' omitted to avoid conflict with Euler constant)
		var ellipse = {};
		ellipse.cx = (C*D-B*F)/(B*B-A*C);
		ellipse.cy = (A*F-B*D)/(B*B-A*C);
		ellipse.majorAxis = Math.sqrt((2*(A*F*F+C*D*D+G*B*B-2*B*D*F-A*C*G))/((B*B-A*C)*(+Math.sqrt((A-C)*(A-C)+4*B*B)-(A+C))));
		ellipse.minorAxis = Math.sqrt((2*(A*F*F+C*D*D+G*B*B-2*B*D*F-A*C*G))/((B*B-A*C)*(-Math.sqrt((A-C)*(A-C)+4*B*B)-(A+C))));
		ellipse.rotation = Math.atan2(2*B,A-C)/2 + Math.PI/2; // this is simplified version (I hope) of equation 23 from Wolfram
		return ellipse;
	}
	
	function drawBox(box) {
		
		// The box is given by its center and two vectors which specify "upward" and "right" directions relatively to the box, so that center+u+v is one of the corners
		
		var c = box.center;
		var u = box.u;
		var v = box.v;
		
		function add(a,b){return {x:a.x+b.x,y:a.y+b.y,z:a.z+b.z}}
		function sub(a,b){return {x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}}
		function project(v){return {x:v.x/v.z,y:v.y/v.z}}
		
		var A = project(add(add(c,u),v));
		var B = project(add(sub(c,u),v));
		var C = project(sub(sub(c,u),v));
		var D = project(sub(add(c,u),v));
		
		return ['M', A.x, A.y, 'L', B.x, B.y, 'L', C.x, C.y, 'L', D.x, D.y, 'z'].join(' ');
	}
	function circleFromBox(box){
		
		var u = box.u;
		var v = box.v;
		
		var circle = {};
		circle.center = box.center;
		circle.normal = {};
		circle.normal.x = u.y * v.z - u.z * v.y;
		circle.normal.y = u.z * v.x - u.x * v.z;
		circle.normal.z = u.x * v.y - u.y * v.x;
		circle.radius = Math.sqrt(u.x * u.x + u.y * u.y + u.z * u.z);
		return circle;
	}
	
	var Init = function() {
		
		var canvasesId = 'canvases';
		$('#' + canvasesId).remove();
		var canvases = $(document.createElement('div'));
		canvases.attr('id', canvasesId);
		canvases.css('position', 'absolute');
		canvases.css('top', '4em');
		canvases.css('left', '45em');
		canvases.css('width', '54em');
		canvases.css('height', '40em');
		canvases.css('overflow', 'auto');
		$('body').append(canvases);
		
		var redrawButton = $(document.createElement('button'));
		redrawButton.on('click', function() { Init(); });
		redrawButton.text('Re-Init');
		canvases.append(redrawButton);
		
		var lightDict = ReadLights('lights');
		var cameraDict = ReadCameras('cameras');
		var geometryDict = ReadGeometries('geometries');
		var meshDict = ReadMeshes('meshes', geometryDict);
		var sceneDict = ReadScenes('scenes', cameraDict, meshDict, lightDict);
		
		MakeSliders(canvases, meshDict);
		
		ReadCanvases('canvases', canvases, sceneDict);
		
		RedrawAll();
	};
	
	// ultimately we want to move away from hand-rolled controls - migrate this to datgui
	var MakeSliders = function(canvases, meshDict) {
		
		var sliderx = $(document.createElement('div'));
		sliderx.css('margin', '1em');
		canvases.append(sliderx);
		sliderx.slider();
		sliderx.on('slide', function(event, ui) { // 'slidechange', 'slide'
			var val = ui.value / 100;
			var mesh = meshDict[Griddl.GetData('controls')[0].mesh];
			var variable = Griddl.GetData('controls')[0].variable;
			var value = mesh[variable];
			if (variable == 'rotation') { val *= 2 * Math.PI; }
			value.x = val;
			mesh[variable] = value;
			RedrawAll();
		});
		
		var slidery = $(document.createElement('div'));
		slidery.css('margin', '1em');
		canvases.append(slidery);
		slidery.slider();
		slidery.on('slide', function(event, ui) { // 'slidechange', 'slide'
			var val = ui.value / 100;
			var mesh = meshDict[Griddl.GetData('controls')[0].mesh];
			var variable = Griddl.GetData('controls')[0].variable;
			var value = mesh[variable];
			if (variable == 'rotation') { val *= 2 * Math.PI; }
			value.y = val;
			mesh[variable] = value;
			RedrawAll();
		});
		
		var sliderz = $(document.createElement('div'));
		sliderz.css('margin', '1em');
		canvases.append(sliderz);
		sliderz.slider();
		sliderz.on('slide', function(event, ui) { // 'slidechange', 'slide'
			var val = ui.value / 100;
			var mesh = meshDict[Griddl.GetData('controls')[0].mesh];
			var variable = Griddl.GetData('controls')[0].variable;
			var value = mesh[variable];
			if (variable == 'rotation') { val *= 2 * Math.PI; }
			value.z = val;
			mesh[variable] = value;
			RedrawAll();
		});
	};
	
	var ReadLights = function(lightsName) {
		
		var lightDict = {};
		var lightObjs = Griddl.GetDataSafe(lightsName);
		
		for (var i = 0; i < lightObjs.length; i++)
		{
			var o = lightObjs[i];
			var light = {};
			light.name = o.name;
			light.position = {x:parseFloat(o.x),y:parseFloat(o.y),z:parseFloat(o.z)};
			light.color = {r:parseFloat(o.r),g:parseFloat(o.g),b:parseFloat(o.b)};
			light.intensity = parseFloat(o.intensity);
			lightDict[light.name] = light;
		}
		
		return lightDict;
	};
	var ReadCameras = function(camerasName) {
		
		var cameraObjs = Griddl.GetData(camerasName);
		var cameraDict = {};
		
		for (var i = 0; i < cameraObjs.length; i++)
		{
			var o = cameraObjs[i];
			var camera = {};
			camera.name = o.name;
			camera.position = new BABYLON.Vector3(parseFloat(o.xPos), parseFloat(o.yPos), parseFloat(o.zPos));
			camera.target = new BABYLON.Vector3(parseFloat(o.xTarget), parseFloat(o.yTarget), parseFloat(o.zTarget));
			cameraDict[camera.name] = camera;
		}
		
		return cameraDict;
	};
	var ReadMesh = function(vertices, polygons, uvPatches) {
		
		var mesh = new SoftEngine.Mesh(null, vertices.length, polygons.length);
		
		for (var i = 0; i < vertices.length; i++)
		{
			var v = {};
			var x = parseFloat(vertices[i].x);
			var y = parseFloat(vertices[i].y);
			var z = parseFloat(vertices[i].z);
			v.Coordinates = {x:x,y:y,z:z};
			v.Normal = new BABYLON.Vector3(0, 0, 0);
			
			if (vertices[i].u && vertices[i].v)
			{
				v.uv = {u:parseFloat(vertices[i].u),v:parseFloat(vertices[i].v)};
			}
			else
			{
				v.uv = {u:0,v:0}; // should we even have a default or just leave it null?
			}
			
			//v.u = parseFloat(vertices[i].u);
			//v.v = parseFloat(vertices[i].v);
			mesh.vertices[i] = v;
		}
		
		for (var i = 0; i < polygons.length; i++)
		{
			var poly = {};
			poly.vertices = [];
			poly.uvs = [];
			
			var k = 0;
			while (polygons[i][k])
			{
				poly.vertices.push(mesh.vertices[polygons[i][k]]);
				poly.uvs.push(mesh.vertices[polygons[i][k]].uv);
				k++;
			}
			
			//for (var key in polygons[i])
			//{
			//	poly.vertices.push(mesh.vertices[polygons[i][key]]);
			//}
			
			poly.Normal = null;
			mesh.polygons[i] = poly;
		}
		
		if (uvPatches)
		{
			for (var i = 0; i < uvPatches.length; i++)
			{
				var patch = uvPatches[i];
				mesh.polygons[patch.polygon].uvs[patch.vertex] = {u:patch.u,v:patch.v};
			}
		}
		
		return mesh;
	};
	// this is basically a wrapper for ReadMesh - they could be consolidated
	var ReadGeometries = function(geometriesName) {
		
		var geometryDict = {};
		var geometryObjs = Griddl.GetDataSafe(geometriesName);
		
		for (var i = 0; i < geometryObjs.length; i++)
		{
			var o = geometryObjs[i];
			geometryDict[o.name] = ReadMesh(Griddl.GetData(o.vertices), Griddl.GetData(o.polygons), o.uvPatches ? Griddl.GetData(o.uvPatches) : null);
		}
		
		return geometryDict;
	};
	var ReadMeshes = function(meshesName, geometryDict) {
		
		var meshObjs = Griddl.GetData(meshesName);
		var meshDict = {};
		
		for (var i = 0; i < meshObjs.length; i++)
		{
			var o = meshObjs[i];
			var mesh = null;
			
			if (geometryDict[o.geometry])
			{
				mesh = geometryDict[o.geometry];
			}
			else if (geometryFunctions[o.geometry])
			{
				if (o.geometry == 'Chainlink')
				{
					mesh = geometryFunctions.Chainlink(1, 1, 0.1, 40, 10); // reasonable parameters
				}
				else if (o.geometry == 'Cube')
				{
					mesh = geometryFunctions.Cube();
				}
				else if (o.geometry == 'Torus')
				{
					mesh = geometryFunctions.Torus(1, 0.2, 40, 10); // reasonable parameters
				}
				else if (o.geometry == 'Cylinder')
				{
					mesh = geometryFunctions.Cylinder(16);
				}
				else if (o.geometry == 'SquareChainlink')
				{
					mesh = geometryFunctions.SquareChainlink(3, 2, 1);
				}
				else if (o.geometry == 'Coil')
				{
					mesh = geometryFunctions.Coil(5, 20);
				}
				
				//mesh = geometryFunctions[o.geometry]();
				geometryDict[o.geometry] = mesh; // memoize function result
			}
			
			mesh.texture = new Texture(Griddl.GetData(o.texture));
			
			var sclComponents = o.scale.substr(1, o.rotation.length - 2).split(',');
			var posComponents = o.position.substr(1, o.position.length - 2).split(',');
			var rotComponents = o.rotation.substr(1, o.rotation.length - 2).split(',');
			mesh.scale = new BABYLON.Vector3(parseFloat(sclComponents[0]), parseFloat(sclComponents[1]), parseFloat(sclComponents[2]));
			mesh.position = new BABYLON.Vector3(parseFloat(posComponents[0]), parseFloat(posComponents[1]), parseFloat(posComponents[2]));
			mesh.rotation = new BABYLON.Vector3(parseFloat(rotComponents[0]), parseFloat(rotComponents[1]), parseFloat(rotComponents[2]));
			
			meshDict[o.name] = mesh;
		}
		
		return meshDict;
	};
	var ReadScenes = function(scenesName, cameraDict, meshDict, lightDict) {
		
		var sceneObjs = Griddl.GetData(scenesName);
		var sceneDict = {};
		
		for (var i = 0; i < sceneObjs.length; i++)
		{
			var o = sceneObjs[i];
			
			var meshes = [];
			var camera = new SoftEngine.Camera();
			var lights = [];
			
			camera.Position = cameraDict[o.camera].position;
			camera.Target = cameraDict[o.camera].target;
			
			var meshNames = o.meshes.split(',');
			
			for (var k = 0; k < meshNames.length; k++)
			{
				meshes.push(meshDict[meshNames[k]]);
			}
			
			var lightNames = o.lights.split(',');
			
			for (var k = 0; k < lightNames.length; k++)
			{
				lights.push(lightDict[lightNames[k]]);
			}
			
			sceneDict[o.name] = { meshes : meshes , camera : camera , lights : lights };
		}
		
		return sceneDict;
	};
	
	// this is flat-out contrary to the code in deck - Griddl.SetupContext creates canvases - so some more serious reworking will be necessary
	var ReadCanvases = function(canvasesName, parentDiv, sceneDict) {
		
		var canvasObjs = Griddl.GetData(canvasesName);
		
		for (var i = 0; i < canvasObjs.length; i++)
		{
			var o = canvasObjs[i];
			var canvas = $(document.createElement('canvas'));
			canvas.attr('id', o.name);
			canvas.attr('width', o.width);
			canvas.attr('height', o.height);
			canvas.css('border', '1px solid #c3c3c3');
			canvas.css('margin-bottom', '1em');
			parentDiv.append(canvas);
			
			var left = parseInt(o.left);
			var top = parseInt(o.top);
			
			var scene = sceneDict[o.scene];
			var device = new SoftEngine.Device(canvas[0], left, top);
			scenes.push(scene);
			devices.push(device); // this is a closure variable - SoftEngine.devices is a list that is referenced by SoftEngine.RedrawAll()
		}
	};
	
	var Camera = (function () {
		
		function Camera() {
			this.Position = BABYLON.Vector3.Zero();
			this.Target = BABYLON.Vector3.Zero();
		}
		
		return Camera;
	})();
	var Mesh = (function () {
		
		function Mesh() {
			this.name = null;
			this.vertices = null;
			this.polygons = null;
			this.scale = new BABYLON.Vector3(1, 1, 1);
			this.rotation = new BABYLON.Vector3(0, 0, 0);
			this.position = new BABYLON.Vector3(0, 0, 0);
			this.texture = null; // Texture
		}
		
		//function Mesh(name, verticesCount, facesCount)
		//{
		//	this.name = name;
		//	this.vertices = new Array(verticesCount);
		//	this.polygons = new Array(facesCount);
		//	this.scale = 1;
		//	this.rotation = new BABYLON.Vector3(0, 0, 0);
		//	this.position = new BABYLON.Vector3(0, 0, 0);
		//}
		
		Mesh.prototype.computeFacesNormals = function() {
			for (var i = 0; i < this.polygons.length; i++)
			{
				var poly = this.polygons[i];
				
				// assumption of triangle
				var vertexA = this.vertices[poly.vertices[0]];
				var vertexB = this.vertices[poly.vertices[1]];
				var vertexC = this.vertices[poly.vertices[2]];
				
				this.polygons[i].Normal = (vertexA.Normal.add(vertexB.Normal.add(vertexC.Normal))).scale(1 / 3);
				this.polygons[i].Normal.normalize();
			}
		};
		
		return Mesh;
	})();
	var Texture = (function () {
		function Texture(img) {
		
			var internalContext = null;
			
			if (img.constructor.name == 'CanvasRenderingContext2D')
			{
				this.width = img.canvas.width;
				this.height = img.canvas.height;
				
				internalContext = img;
			}
			else if (img.constructor.name == 'HTMLImageElement')
			{
				this.width = img.width;
				this.height = img.height;
				
				var internalCanvas = document.createElement('canvas');
				internalCanvas.width = img.width;
				internalCanvas.height = img.height;
				internalContext = internalCanvas.getContext('2d');
				internalContext.drawImage(img, 0, 0);
			}
			else
			{
				throw new Error();
			}
			
			this.internalBuffer = internalContext.getImageData(0, 0, this.width, this.height);
		}
		
		Texture.prototype.map = function(tu, tv) {
			
			if (this.internalBuffer)
			{
				var u = Math.abs(((tu * this.width) % this.width)) >> 0;
				var v = Math.abs(((tv * this.height) % this.height)) >> 0;
				var pos = (u + v * this.width) * 4;
				var r = this.internalBuffer.data[pos + 0];
				var g = this.internalBuffer.data[pos + 1];
				var b = this.internalBuffer.data[pos + 2];
				var a = this.internalBuffer.data[pos + 3];
				return new BABYLON.Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
			}
			else
			{
				return new BABYLON.Color4(1, 1, 1, 1);
			}
		};
		
		return Texture;
	})();
	var Vertex = (function () {
		
		function Vertex() {
			this.Coordinates = null; // BABYLON.Vector3
			this.Normal = new BABYLON.Vector3(0, 0, 0); // BABYLON.Vector3
			this.WorldCoordinates = new BABYLON.Vector3(0, 0, 0); // BABYLON.Vector3
			this.TextureCoordinates = null; // BABYLON.Vector2
		}
		
		return Vertex;
	})();
	var Polygon = (function () {
		
		function Polygon() {
			this.vertices = null; // [ Vertex ]
			this.uvs = null; // [ BABYLON.Vector2 ] - if uvs is null, the polygon gets its uv's from the underlying vertices
		}
		
		return Polygon;
	})();
	
	var MakeDevice = function(g, left, top, width, height) {
		var device = {};
		device.left = left;
		device.top = top;
		device.workingWidth = width ? width : g.canvas.width;
		device.workingHeight = height ? height : g.canvas.height;
		device.workingContext = g;
		device.depthbuffer = new Array(device.workingWidth * device.workingHeight);
		return device;
	};
	
	var Device = function(canvas, left, top) {
		this.workingCanvas = canvas;
		this.left = left;
		this.top = top;
		this.workingWidth = canvas.width;
		this.workingHeight = canvas.height;
		//this.workingContext = this.workingCanvas.getContext("2d");
		this.workingContext = GriddlCanvas.GetCanvasContext(this.workingCanvas);
		this.depthbuffer = new Array(this.workingWidth * this.workingHeight);
	};
	
	SoftEngine.ReadDazFile = function(x) {
		
		var vertices = x.geometry_library[0].vertices.values; // [ [x,y,z] ]
		var polygons = x.geometry_library[0].polylist.values; // [ [polygonGroupIndex,polygonMaterialGroupIndex,vertexIndex0,vertexIndex1,vertexIndex2,vertexIndex3] ]
		
		var mesh = new Mesh();
		mesh.vertices = new Array(vertices.length);
		mesh.polygons = new Array(polygons.length);
		
		for (var i = 0; i < vertices.length; i++)
		{
			var vertex = new Vertex();
			vertex.Coordinates = new BABYLON.Vector3(vertices[i][0], vertices[i][1], vertices[i][2]);
			mesh.vertices[i] = vertex;
		}
		
		for (var i = 0; i < polygons.length; i++)
		{
			var polygon = new Polygon();
			polygon.vertices = [];
			polygon.vertices.push(mesh.vertices[polygons[i][2]]);
			polygon.vertices.push(mesh.vertices[polygons[i][3]]);
			polygon.vertices.push(mesh.vertices[polygons[i][4]]);
			polygon.vertices.push(mesh.vertices[polygons[i][5]]);
			mesh.polygons[i] = polygon;
		}
		
		return mesh;
	};
	SoftEngine.ReadUvSet = function(mesh, x) {
		
		var uvs = x.uv_set_library[0].uvs.values; // [ [u,v] ]
		var pvi = x.uv_set_library[0].polygon_vertex_indices; // [ [polygonIndex,vertexIndex,uvIndex] ]
		
		for (var i = 0; i < mesh.vertices.length; i++)
		{
			mesh.vertices[i].TextureCoordinates = new BABYLON.Vector2(uvs[i][0], 1-uvs[i][1]);
		}
		
		for (var i = 0; i < pvi.length; i++)
		{
			var polygon = mesh.polygons[pvi[i][0]];
			var vertex = mesh.vertices[pvi[i][1]];
			var uv = new BABYLON.Vector2(uvs[pvi[i][2]][0], 1-uvs[pvi[i][2]][1]);
			
			polygon.uvs = [];
			
			for (var k = 0; k < polygon.vertices.length; k++)
			{
				if (polygon.vertices[k] == vertex)
				{
					polygon.uvs.push(uv);
				}
				else
				{
					polygon.uvs.push(polygon.vertices[k].TextureCoordinates);
				}
			}
		}
	};
	
	SoftEngine.Centroid = function(mesh) {
		
		var xsum = 0;
		var ysum = 0;
		var zsum = 0;
		
		var n = mesh.vertices.length;
		for (var i = 0; i < n; i++)
		{
			xsum += mesh.vertices[i].Coordinates.x;
			ysum += mesh.vertices[i].Coordinates.y;
			zsum += mesh.vertices[i].Coordinates.z;
		}
		
		return new BABYLON.Vector3(xsum / n, ysum / n, zsum / n);
	};
	
	SoftEngine.OrbitControls = function(device, scene) {
		
		// this assumes the camera target is (0,0,0) - we need to generalize it so that it orbits around the camera target
		
		var savedRenderMode = null;
		
		var canvas = $(device.workingContext.canvas);
		
		canvas.off('mousedown');
		
		canvas.on('mousedown', function(downEvent) {
			
			savedRenderMode = SoftEngine.renderMode;
			SoftEngine.renderMode = SoftEngine.POINT;
			
			var cx = scene.camera.Position.x - scene.camera.Target.x;
			var cy = scene.camera.Position.y - scene.camera.Target.y;
			var cz = scene.camera.Position.z - scene.camera.Target.z;
			
			var theta = Math.atan2(cz, cx);
			var radius = Math.sqrt(cx*cx+cy*cy+cz*cz);
			var phi = Math.acos(cy/radius);
			
			var origX = downEvent.offsetX;
			var origY = downEvent.offsetY;
			
			//console.log('down ' + origX + ',' + origY);
			
			canvas.on('mousemove', function(moveEvent) {
				var currX = moveEvent.offsetX;
				var currY = moveEvent.offsetY;
				
				//console.log('move ' + currX + ',' + currY);
				
				var dx = currX - origX;
				var dy = currY - origY;
				
				var newtheta = theta - dx / 200;
				var newphi = phi - dy / 200;
				
				//if (newphi > (Math.PI/2)) { newphi = Math.PI / 2; }
				//if (newphi < (-Math.PI/2)) { newphi = -Math.PI / 2; }
				
				var nx = radius * Math.cos(newtheta) * Math.sin(newphi);
				var nz = radius * Math.sin(newtheta) * Math.sin(newphi);
				var ny = radius * Math.cos(newphi);
				
				scene.camera.Position = scene.camera.Target.add(new BABYLON.Vector3(nx, ny, nz));
				SoftEngine.Render(device, scene);
			});
			
			canvas.on('mouseup', function(upEvent) { canvas.off('mousemove'); SoftEngine.renderMode = savedRenderMode; SoftEngine.Render(device, scene); });
		});
		
		canvas.on('mousewheel', function(wheelEvent) {
			
			// largely copy pasted from above
			
			var cx = scene.camera.Position.x - scene.camera.Target.x;
			var cy = scene.camera.Position.y - scene.camera.Target.y;
			var cz = scene.camera.Position.z - scene.camera.Target.z;
			
			var theta = Math.atan2(cz, cx);
			var radius = Math.sqrt(cx*cx+cy*cy+cz*cz);
			var phi = Math.acos(cy/radius);
			
			var newradius = radius + (wheelEvent.originalEvent.wheelDelta / 120) * 10;
			
			var nx = newradius * Math.cos(theta) * Math.sin(phi);
			var nz = newradius * Math.sin(theta) * Math.sin(phi);
			var ny = newradius * Math.cos(phi);
			
			scene.camera.Position = scene.camera.Target.add(new BABYLON.Vector3(nx, ny, nz));
			SoftEngine.Render(device, scene);
		});
	};
	
	SoftEngine.TestImage = function(params) {
		
		if (params.bands == null)
		{
			params.bands = params.imgWidth / params.bandWidth;
		}
		
		if (params.bandWidth == null)
		{
			params.bandWidth = params.imgWidth / params.bands;
		}
		
		if (params.imgWidth == null)
		{
			params.imgWidth = params.bands * params.bandWidth;
		}
		
		var bands = params.bands;
		var bandWidth = params.bandWidth;
		var imgWidth = params.imgWidth;
		
		var canvas = document.createElement('canvas');
		canvas.width = imgWidth;
		canvas.height = imgWidth;
		var g = canvas.getContext('2d');
		
		for (var i = 0; i < bands; i++)
		{
			for (var j = 0; j < bands; j++)
			{
				g.fillStyle = ((i+j) % 2 == 0) ? 'gray' : 'white';
				g.fillRect(i*bandWidth, j*bandWidth, bandWidth, bandWidth);
				g.font = '10pt Arial';
				var textX = (i+0.5)*bandWidth;
				var textY = (j+0.5)*bandWidth;
				g.textAlign = 'center';
				g.textBaseline = 'middle';
				g.fillStyle = 'black';
				g.fillText(i+','+j, textX, textY);
			}
		}
		
		return g;
	};
	SoftEngine.StripedCloth = function(params, textParams) {
		
		if (params.bands == null)
		{
			params.bands = params.imgWidth / params.bandWidth;
		}
		
		if (params.bandWidth == null)
		{
			params.bandWidth = params.imgWidth / params.bands;
		}
		
		if (params.imgWidth == null)
		{
			params.imgWidth = params.bands * params.bandWidth;
		}
		
		var bands = params.bands;
		var bandWidth = params.bandWidth;
		var imgWidth = params.imgWidth;
		
		var canvas = document.createElement('canvas');
		canvas.width = imgWidth;
		canvas.height = imgWidth;
		var ctx = canvas.getContext('2d');
		
		for (var i = 0; i < bands; i++)
		{
			ctx.fillStyle = (i % 2 == 0) ? 'black' : 'white';
			ctx.fillRect(0, i * bandWidth, imgWidth, bandWidth);
		}
		
		SoftEngine.ApplyText(ctx, textParams);
		SoftEngine.ApplyCloth(ctx, imgWidth);
		
		return ctx;
	};
	SoftEngine.SolidCloth = function(params, textParams) {
		
		var imgWidth = params.imgWidth;
		
		var canvas = document.createElement('canvas');
		canvas.width = imgWidth;
		canvas.height = imgWidth;
		var ctx = canvas.getContext('2d');
		
		ctx.fillStyle = params.color;
		ctx.fillRect(0, 0, imgWidth, imgWidth);
		
		SoftEngine.ApplyText(ctx, textParams);
		SoftEngine.ApplyCloth(ctx, imgWidth);
		
		return ctx;
	};
	
	SoftEngine.ApplyCloth = function(ctx, imgWidth) {
		
		var imageData = ctx.getImageData(0, 0, imgWidth, imgWidth);
		var array = imageData.data;
		
		for (var y = 0; y < imageData.height; y++)
		{
			for (var x = 0; x < imageData.width; x++)
			{
				var index = (y * imageData.width + x) * 4;
				
				var R = array[index + 0];
				var G = array[index + 1];
				var B = array[index + 2];
				
				var noise = Math.random() * 30;
				var stitch = 2;
				var resultR = 0;
				var resultG = 0;
				var resultB = 0;
				
				noise += (x % 3 == 0) ? +stitch : -stitch;
				noise += (y % 3 == 0) ? +stitch : -stitch;
				
				resultR = R + ((R == 0) ? +noise : -noise);
				resultG = G + ((G == 0) ? +noise : -noise);
				resultB = B + ((B == 0) ? +noise : -noise);
				
				array[index + 0] = resultR;
				array[index + 1] = resultG;
				array[index + 2] = resultB;
			}
		}
		
		ctx.putImageData(imageData, 0, 0);
	};
	SoftEngine.ApplyText = function(ctx, textParams) {
		
		ctx.font = textParams.font;
		ctx.textAlign = textParams.textAlign;
		ctx.textBaseline = textParams.textBaseline;
		ctx.fillStyle = textParams.fillStyle;
		
		ctx.fillText(textParams.str, textParams.textX, textParams.textY);
		//ctx.save();
		//ctx.translate(textParams.textX, textParams.textY);
		//ctx.scale(-1, 1);
		//ctx.fillText(textParams.str, 0, 0);
		//ctx.restore();
	};
	
	SoftEngine.geometryFunctions = geometryFunctions;
	SoftEngine.ReadMesh = ReadMesh;
	SoftEngine.Init = Init;
	SoftEngine.Camera = Camera;
	SoftEngine.Mesh = Mesh;
	SoftEngine.Texture = Texture;
	SoftEngine.Device = Device;
	SoftEngine.MakeDevice = MakeDevice;
	SoftEngine.Render = Render;
})(SoftEngine || (SoftEngine = {}));

