
var TheGeom = (function() {
	
	var Geom = {};
	
	var Vector = Geom.Vector = function(a, b) {
		var v = {};
		v.x = b.x - a.x;
		v.y = b.y - a.y;
		RecalcPolar(v);
		return v;
	};
	var RecalcXY = Geom.RecalcXY = function(vector) {
		vector.x = vector.distance * Math.cos(vector.angle);
		vector.y = vector.distance * Math.sin(vector.angle);
	};
	var RecalcPolar = Geom.RecalcPolar = function(vector) {
		vector.distance = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
		vector.angle = Math.atan2(vector.y, vector.x);
	};
	var Add = Geom.Add = function(a, b) {
		var v = {};
		v.x = a.x + b.x;
		v.y = a.y + b.y;
		RecalcPolar(v);
		return v;
	};
	var Rotate = Geom.Rotate = function(vector, angle) {
		vector.angle += angle;
		RecalcXY(vector);
	};
	var RotateDegrees = Geom.RotateDegrees = function(vector, angle) {
		vector.angle += angle / 360 * Math.PI * 2;
		RecalcXY(vector);
	};
	var Scale = Geom.Scale = function(vector, scale) {
		vector.distance *= scale;
		RecalcXY(vector);
	};
	var SetDist = Geom.SetDist = function(vector, dist) {
		vector.distance = dist;
		RecalcXY(vector);
	};
	var SetAngle = Geom.SetAngle = function(vector, angle) {
		vector.angle = angle;
		RecalcXY(vector);
	};
	var SetAngleDegrees = Geom.SetAngleDegrees = function(vector, angle) {
		vector.angle = angle / 360 * Math.PI * 2;
		RecalcXY(vector);
	};
	
	// Ax + By + C = 0
	// Axx + Bxy + Cyy + Dx + Ey + F = 0
	
	var RotatePointAboutPoint = Geom.RotatePointAboutPoint = function(p, radians, c) {
		
		var v = { x : p.x - c.x , y : p.y - c.y };
		var dist = Math.sqrt(v.x*v.x+v.y*v.y);
		var angle = Math.atan2(v.y, v.x);
		angle += radians;
		return { x : c.x + dist * Math.cos(angle) , y : c.y + dist * Math.sin(angle) }
	};
	var RotatePointAboutAxis = Geom.RotatePointAboutAxis = function(p, radians, a, b) {
		
	};
	
	var LinearCoefficients = Geom.LinearCoefficients = function(x0, x1) {
		
		// inputs are the x (or y) coordinates of the endpoints of a line segment
		// output is [a, b] where x = a*t + b
		
		// derivation, where a=x0, b=x1
		// a + t(b-a)
		// (b-a)*t + a
		
		// [ -1 , +1 ] [ x0 ]
		// [ +1 ,  0 ] [ x1 ]
		
		return [ -x0 + x1 , x1 ];
	};
	var QuadraticCoefficients = Geom.QuadraticCoefficients = function(x0, x1, x2) {
		
		// inputs are the x (or y) coordinates of a quadratic bezier curve
		// output is [a, b, c] where x = a*t*t + b*t + c
		
		// derivation, where a=x0, b=x1, c=x2
		// first line:  l = a + t(b - a)
		// second line: m = b + t(c - b)
		// combination: l + t(m - l)
		// combination: a + t(b - a) + t(b + t(c - b) - a - t(b - a))
		// a + tb - ta + t(b + tc - tb - a - tb + at)
		// a + tb - ta + tb + ttc - ttb - ta - ttb + att
		// - ttb + att + ttc - ttb + tb - ta + tb - ta + a
		// (a-2*b+c)*t*t + (-2*a+2*b)*t + a
		
		// [ +1 , -2 , +1 ] [ x0 ]
		// [ -2 , +2 ,  0 ] [ x1 ]
		// [ +1 ,  0 ,  0 ] [ x2 ]
		
		return [ x0 - 2*x1 + x2 , -2*x0 + 2*x1 , x0 ];
	};
	var CubicCoefficients = Geom.CubicCoefficients = function(x0, x1, x2, x3) {
		
		// inputs are the x (or y) coordinates of a cubic bezier curve
		// output is [a, b, c, d] where x = a*t*t*t + b*t*t + c*t + d
		
		// derivation:
		
		// b0 = x0 + t * (x1 - x0)
		// b1 = x1 + t * (x2 - x1)
		// b2 = x2 + t * (x3 - x2)
		
		// c0 = b0 + t * (b1 - b0)
		// c1 = b1 + t * (b2 - b1)
		
		// x = c0 + t * (c1 - c0)
		
		
		// x = c0 + t * (c1 - c0)
		// x = b0 + t * (b1 - b0) + t * (b1 + t * (b2 - b1) - (b0 + t * (b1 - b0)))
		// x = b0 + t * b1 - t * b0 + t * (b1 + t * b2 - t * b1 - b0 - t * b1 + t * b0)
		// x = b0 + t * b1 - t * b0 + t * b1 + t * t * b2 - t * t * b1 - t * b0 - t * t * b1 + t * t * b0
		// x = b0 * (1 - 2t + t*t) + b1 * (2t - 2t*t) + b2 * (t*t)
		// x = (x0 + t * (x1 - x0)) * (1 - 2t + t*t) + (x1 + t * (x2 - x1)) * (2t - 2t*t) + (x2 + t * (x3 - x2)) * (t*t)
		// x = (1 - 2t + t*t) * x0 + (1 - 2t + t*t) * t * x1 - (1 - 2t + t*t) * t * x0 + (2t - 2t*t) * x1 + (2t - 2t*t) * t * x2 - (2t - 2t*t) * t * x1 + (t*t) * x2 + (t*t) * t * x3 - (t*t) * t * x2
		
		// x =
		// (1 - 3t + 3t*t - t*t*t) * x0
		// (3t - 6t*t + 3t*t*t) * x1
		// (3t*t - 3t*t*t) * x2
		// (t*t*t) * x3
		
		// [ -1 , +3 , -3 , +1 ] [ x0 ]
		// [ +3 , -6 , +3 ,  0 ] [ x1 ]
		// [ -3 , +3 ,  0 ,  0 ] [ x2 ]
		// [ +1 ,  0 ,  0 ,  0 ] [ x3 ]
		
		return [ -x0+3*x1+-3*x2+x3 , 3*x0-6*x1+3*x2 , -3*x0+3*x1 , x0 ];
	};
	
	var LinearRoots = Geom.LinearRoots = function(a, b) {
		
		// a*x + b = 0
		
		if (a == 0)
		{
			if (b == 0)
			{
				// infinite roots
				return [-Infinity, +Infinity];
			}
			else
			{
				// no roots
				return [];
			}
		}
		else
		{
			return [ -b/a ];
		}
	};
	var QuadraticRoots = Geom.QuadraticRoots = function(a, b, c) {
		
		// a*x*x + b*x + c = 0
		
		if (a == 0) { return LinearRoots(b, c); }
		
		var r0 = (b + Math.sqrt(b*b - 4*a*c)) / 2*a;
		var r1 = (b - Math.sqrt(b*b - 4*a*c)) / 2*a;
		return [r0, r1];
	};
	var CubicRoots = Geom.CubicRoots = function(a, b, c, d) {
		
		// based on http://mysite.verizon.net/res148h4j/javascript/script_exact_cubic.html#the%20source%20code
		// a*x*x*x + b*x*x + c*x + d = 0
		
		if (a == 0) { return QuadraticRoots(b, c, d); }
		
		var A = b / a;
		var B = c / a;
		var C = d / a;
		
		var Q = (3*B - Math.pow(A, 2))/9;
		var R = (9*A*B - 27*C - 2*Math.pow(A, 3))/54;
		var D = Math.pow(Q, 3) + Math.pow(R, 2); // polynomial discriminant
		
		//console.log('Q: ' + Q);
		//console.log('R: ' + R);
		//console.log('D: ' + D);
		
		var t = [];
		
		if (D >= 0) // complex or duplicate roots
		{
			function sgn(x) { if (x < 0.0) { return -1; } else { return 1; } }
			var S = sgn(R + Math.sqrt(D))*Math.pow(Math.abs(R + Math.sqrt(D)),(1/3));
			var T = sgn(R - Math.sqrt(D))*Math.pow(Math.abs(R - Math.sqrt(D)),(1/3));
			
			t.push(-A/3 + (S + T)); // real root
			
			var Im = Math.abs(Math.sqrt(3)*(S - T)/2); // complex part of root pair
			
			//console.log('S: ' + Q);
			//console.log('T: ' + R);
			//console.log('Im: ' + Im);
			
			if (Im == 0)
			{
				t.push(-A/3 - (S + T)/2); // real part of complex root
				t.push(-A/3 - (S + T)/2); // real part of complex root
			}
		}
		else // distinct real roots
		{
			var th = Math.acos(R/Math.sqrt(-Math.pow(Q, 3)));
			
			//console.log('th: ' + th);
			
			t.push(2*Math.sqrt(-Q)*Math.cos(th/3) - A/3);
			t.push(2*Math.sqrt(-Q)*Math.cos((th + 2*Math.PI)/3) - A/3);
			t.push(2*Math.sqrt(-Q)*Math.cos((th + 4*Math.PI)/3) - A/3);
		}
		
		//console.log(t);
		
		return t;
	};
	
	return Geom;
})();

if (typeof window !== 'undefined') {
	if (typeof Griddl === 'undefined') { var Griddl = {}; }
	Griddl.Geom = TheGeom;
}
else {
	exports.Geom = TheGeom;
}

