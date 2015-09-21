
//var BABYLON = require('C:\\cygwin64\\home\\adam\\frce\\mysite\\griddl\\static\\griddl\\js\\lib\\babylon.math.js'); BABYLON = BABYLON.BABYLON;

var BABYLON;
(function (BABYLON) {
    var Color4 = (function () {
        function Color4(initialR, initialG, initialB, initialA) {
            this.r = initialR;
            this.g = initialG;
            this.b = initialB;
            this.a = initialA;
        }
        Color4.prototype.toString = function () {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        };
        return Color4;
    })();
    BABYLON.Color4 = Color4;    
    var Vector2 = (function () {
        function Vector2(initialX, initialY) {
            this.x = initialX;
            this.y = initialY;
        }
        Vector2.prototype.toString = function () {
            return "{X: " + this.x + " Y:" + this.y + "}";
        };
        Vector2.prototype.add = function (otherVector) {
            return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
        };
        Vector2.prototype.subtract = function (otherVector) {
            return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
        };
        Vector2.prototype.negate = function () {
            return new Vector2(-this.x, -this.y);
        };
        Vector2.prototype.scale = function (scale) {
            return new Vector2(this.x * scale, this.y * scale);
        };
        Vector2.prototype.equals = function (otherVector) {
            return this.x === otherVector.x && this.y === otherVector.y;
        };
        Vector2.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
        Vector2.prototype.lengthSquared = function () {
            return (this.x * this.x + this.y * this.y);
        };
        Vector2.prototype.normalize = function () {
            var len = this.length();
            if(len === 0) {
                return;
            }
            var num = 1.0 / len;
            this.x *= num;
            this.y *= num;
        };
        Vector2.Zero = function Zero() {
            return new Vector2(0, 0);
        };
        Vector2.Copy = function Copy(source) {
            return new Vector2(source.x, source.y);
        };
        Vector2.Normalize = function Normalize(vector) {
            var newVector = Vector2.Copy(vector);
            newVector.normalize();
            return newVector;
        };
        Vector2.Minimize = function Minimize(left, right) {
            var x = (left.x < right.x) ? left.x : right.x;
            var y = (left.y < right.y) ? left.y : right.y;
            return new Vector2(x, y);
        };
        Vector2.Maximize = function Maximize(left, right) {
            var x = (left.x > right.x) ? left.x : right.x;
            var y = (left.y > right.y) ? left.y : right.y;
            return new Vector2(x, y);
        };
        Vector2.Transform = function Transform(vector, transformation) {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]);
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]);
            return new Vector2(x, y);
        };
        Vector2.Distance = function Distance(value1, value2) {
            return Math.sqrt(Vector2.DistanceSquared(value1, value2));
        };
        Vector2.DistanceSquared = function DistanceSquared(value1, value2) {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            return (x * x) + (y * y);
        };
        return Vector2;
    })();
    BABYLON.Vector2 = Vector2;    
    var Vector3 = (function () {
        function Vector3(initialX, initialY, initialZ) {
            this.x = initialX;
            this.y = initialY;
            this.z = initialZ;
        }
        Vector3.prototype.toString = function () {
            return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + "}";
        };
        Vector3.prototype.add = function (otherVector) {
            return new Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
        };
        Vector3.prototype.subtract = function (otherVector) {
            return new Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
        };
        Vector3.prototype.negate = function () {
            return new Vector3(-this.x, -this.y, -this.z);
        };
        Vector3.prototype.scale = function (scale) {
            return new Vector3(this.x * scale, this.y * scale, this.z * scale);
        };
        Vector3.prototype.equals = function (otherVector) {
            return this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z;
        };
        Vector3.prototype.multiply = function (otherVector) {
            return new Vector3(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z);
        };
        Vector3.prototype.divide = function (otherVector) {
            return new Vector3(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z);
        };
        Vector3.prototype.length = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        };
        Vector3.prototype.lengthSquared = function () {
            return (this.x * this.x + this.y * this.y + this.z * this.z);
        };
        Vector3.prototype.normalize = function () {
            var len = this.length();
            if(len === 0) {
                return;
            }
            var num = 1.0 / len;
            this.x *= num;
            this.y *= num;
            this.z *= num;
        };
        Vector3.FromArray = function FromArray(array, offset) {
            if(!offset) {
                offset = 0;
            }
            return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
        };
        Vector3.Zero = function Zero() {
            return new Vector3(0, 0, 0);
        };
        Vector3.Up = function Up() {
            return new Vector3(0, 1.0, 0);
        };
        Vector3.Copy = function Copy(source) {
            return new Vector3(source.x, source.y, source.z);
        };
        Vector3.TransformCoordinates = function TransformCoordinates(vector, transformation) {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]) + transformation.m[12];
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]) + transformation.m[13];
            var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]) + transformation.m[14];
            var w = (vector.x * transformation.m[3]) + (vector.y * transformation.m[7]) + (vector.z * transformation.m[11]) + transformation.m[15];
            return new Vector3(x / w, y / w, z / w);
        };
        Vector3.TransformNormal = function TransformNormal(vector, transformation) {
            var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]);
            var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]);
            var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]);
            return new Vector3(x, y, z);
        };
        Vector3.Dot = function Dot(left, right) {
            return (left.x * right.x + left.y * right.y + left.z * right.z);
        };
        Vector3.Cross = function Cross(left, right) {
            var x = left.y * right.z - left.z * right.y;
            var y = left.z * right.x - left.x * right.z;
            var z = left.x * right.y - left.y * right.x;
            return new Vector3(x, y, z);
        };
        Vector3.Normalize = function Normalize(vector) {
            var newVector = Vector3.Copy(vector);
            newVector.normalize();
            return newVector;
        };
        Vector3.Distance = function Distance(value1, value2) {
            return Math.sqrt(Vector3.DistanceSquared(value1, value2));
        };
        Vector3.DistanceSquared = function DistanceSquared(value1, value2) {
            var x = value1.x - value2.x;
            var y = value1.y - value2.y;
            var z = value1.z - value2.z;
            return (x * x) + (y * y) + (z * z);
        };
        return Vector3;
    })();
    BABYLON.Vector3 = Vector3;    
    var Matrix = (function () {
        function Matrix() {
            this.m = [];
        }
        Matrix.prototype.isIdentity = function () {
            if(this.m[0] != 1.0 || this.m[5] != 1.0 || this.m[10] != 1.0 || this.m[15] != 1.0) {
                return false;
            }
            if(this.m[12] != 0.0 || this.m[13] != 0.0 || this.m[14] != 0.0 || this.m[4] != 0.0 || this.m[6] != 0.0 || this.m[7] != 0.0 || this.m[8] != 0.0 || this.m[9] != 0.0 || this.m[11] != 0.0 || this.m[12] != 0.0 || this.m[13] != 0.0 || this.m[14] != 0.0) {
                return false;
            }
            return true;
        };
        Matrix.prototype.determinant = function () {
            var temp1 = (this.m[10] * this.m[15]) - (this.m[11] * this.m[14]);
            var temp2 = (this.m[9] * this.m[15]) - (this.m[11] * this.m[13]);
            var temp3 = (this.m[9] * this.m[14]) - (this.m[10] * this.m[13]);
            var temp4 = (this.m[8] * this.m[15]) - (this.m[11] * this.m[12]);
            var temp5 = (this.m[8] * this.m[14]) - (this.m[10] * this.m[12]);
            var temp6 = (this.m[8] * this.m[13]) - (this.m[9] * this.m[12]);
            return ((((this.m[0] * (((this.m[5] * temp1) - (this.m[6] * temp2)) + (this.m[7] * temp3))) - (this.m[1] * (((this.m[4] * temp1) - (this.m[6] * temp4)) + (this.m[7] * temp5)))) + (this.m[2] * (((this.m[4] * temp2) - (this.m[5] * temp4)) + (this.m[7] * temp6)))) - (this.m[3] * (((this.m[4] * temp3) - (this.m[5] * temp5)) + (this.m[6] * temp6))));
        };
        Matrix.prototype.toArray = function () {
            return this.m;
        };
        Matrix.prototype.invert = function () {
            var l1 = this.m[0];
            var l2 = this.m[1];
            var l3 = this.m[2];
            var l4 = this.m[3];
            var l5 = this.m[4];
            var l6 = this.m[5];
            var l7 = this.m[6];
            var l8 = this.m[7];
            var l9 = this.m[8];
            var l10 = this.m[9];
            var l11 = this.m[10];
            var l12 = this.m[11];
            var l13 = this.m[12];
            var l14 = this.m[13];
            var l15 = this.m[14];
            var l16 = this.m[15];
            var l17 = (l11 * l16) - (l12 * l15);
            var l18 = (l10 * l16) - (l12 * l14);
            var l19 = (l10 * l15) - (l11 * l14);
            var l20 = (l9 * l16) - (l12 * l13);
            var l21 = (l9 * l15) - (l11 * l13);
            var l22 = (l9 * l14) - (l10 * l13);
            var l23 = ((l6 * l17) - (l7 * l18)) + (l8 * l19);
            var l24 = -(((l5 * l17) - (l7 * l20)) + (l8 * l21));
            var l25 = ((l5 * l18) - (l6 * l20)) + (l8 * l22);
            var l26 = -(((l5 * l19) - (l6 * l21)) + (l7 * l22));
            var l27 = 1.0 / ((((l1 * l23) + (l2 * l24)) + (l3 * l25)) + (l4 * l26));
            var l28 = (l7 * l16) - (l8 * l15);
            var l29 = (l6 * l16) - (l8 * l14);
            var l30 = (l6 * l15) - (l7 * l14);
            var l31 = (l5 * l16) - (l8 * l13);
            var l32 = (l5 * l15) - (l7 * l13);
            var l33 = (l5 * l14) - (l6 * l13);
            var l34 = (l7 * l12) - (l8 * l11);
            var l35 = (l6 * l12) - (l8 * l10);
            var l36 = (l6 * l11) - (l7 * l10);
            var l37 = (l5 * l12) - (l8 * l9);
            var l38 = (l5 * l11) - (l7 * l9);
            var l39 = (l5 * l10) - (l6 * l9);
            this.m[0] = l23 * l27;
            this.m[4] = l24 * l27;
            this.m[8] = l25 * l27;
            this.m[12] = l26 * l27;
            this.m[1] = -(((l2 * l17) - (l3 * l18)) + (l4 * l19)) * l27;
            this.m[5] = (((l1 * l17) - (l3 * l20)) + (l4 * l21)) * l27;
            this.m[9] = -(((l1 * l18) - (l2 * l20)) + (l4 * l22)) * l27;
            this.m[13] = (((l1 * l19) - (l2 * l21)) + (l3 * l22)) * l27;
            this.m[2] = (((l2 * l28) - (l3 * l29)) + (l4 * l30)) * l27;
            this.m[6] = -(((l1 * l28) - (l3 * l31)) + (l4 * l32)) * l27;
            this.m[10] = (((l1 * l29) - (l2 * l31)) + (l4 * l33)) * l27;
            this.m[14] = -(((l1 * l30) - (l2 * l32)) + (l3 * l33)) * l27;
            this.m[3] = -(((l2 * l34) - (l3 * l35)) + (l4 * l36)) * l27;
            this.m[7] = (((l1 * l34) - (l3 * l37)) + (l4 * l38)) * l27;
            this.m[11] = -(((l1 * l35) - (l2 * l37)) + (l4 * l39)) * l27;
            this.m[15] = (((l1 * l36) - (l2 * l38)) + (l3 * l39)) * l27;
        };
        Matrix.prototype.multiply = function (other) {
            var result = new Matrix();
            result.m[0] = this.m[0] * other.m[0] + this.m[1] * other.m[4] + this.m[2] * other.m[8] + this.m[3] * other.m[12];
            result.m[1] = this.m[0] * other.m[1] + this.m[1] * other.m[5] + this.m[2] * other.m[9] + this.m[3] * other.m[13];
            result.m[2] = this.m[0] * other.m[2] + this.m[1] * other.m[6] + this.m[2] * other.m[10] + this.m[3] * other.m[14];
            result.m[3] = this.m[0] * other.m[3] + this.m[1] * other.m[7] + this.m[2] * other.m[11] + this.m[3] * other.m[15];
            result.m[4] = this.m[4] * other.m[0] + this.m[5] * other.m[4] + this.m[6] * other.m[8] + this.m[7] * other.m[12];
            result.m[5] = this.m[4] * other.m[1] + this.m[5] * other.m[5] + this.m[6] * other.m[9] + this.m[7] * other.m[13];
            result.m[6] = this.m[4] * other.m[2] + this.m[5] * other.m[6] + this.m[6] * other.m[10] + this.m[7] * other.m[14];
            result.m[7] = this.m[4] * other.m[3] + this.m[5] * other.m[7] + this.m[6] * other.m[11] + this.m[7] * other.m[15];
            result.m[8] = this.m[8] * other.m[0] + this.m[9] * other.m[4] + this.m[10] * other.m[8] + this.m[11] * other.m[12];
            result.m[9] = this.m[8] * other.m[1] + this.m[9] * other.m[5] + this.m[10] * other.m[9] + this.m[11] * other.m[13];
            result.m[10] = this.m[8] * other.m[2] + this.m[9] * other.m[6] + this.m[10] * other.m[10] + this.m[11] * other.m[14];
            result.m[11] = this.m[8] * other.m[3] + this.m[9] * other.m[7] + this.m[10] * other.m[11] + this.m[11] * other.m[15];
            result.m[12] = this.m[12] * other.m[0] + this.m[13] * other.m[4] + this.m[14] * other.m[8] + this.m[15] * other.m[12];
            result.m[13] = this.m[12] * other.m[1] + this.m[13] * other.m[5] + this.m[14] * other.m[9] + this.m[15] * other.m[13];
            result.m[14] = this.m[12] * other.m[2] + this.m[13] * other.m[6] + this.m[14] * other.m[10] + this.m[15] * other.m[14];
            result.m[15] = this.m[12] * other.m[3] + this.m[13] * other.m[7] + this.m[14] * other.m[11] + this.m[15] * other.m[15];
            return result;
        };
        Matrix.prototype.equals = function (value) {
            return (this.m[0] === value.m[0] && this.m[1] === value.m[1] && this.m[2] === value.m[2] && this.m[3] === value.m[3] && this.m[4] === value.m[4] && this.m[5] === value.m[5] && this.m[6] === value.m[6] && this.m[7] === value.m[7] && this.m[8] === value.m[8] && this.m[9] === value.m[9] && this.m[10] === value.m[10] && this.m[11] === value.m[11] && this.m[12] === value.m[12] && this.m[13] === value.m[13] && this.m[14] === value.m[14] && this.m[15] === value.m[15]);
        };
        Matrix.FromValues = function FromValues(initialM11, initialM12, initialM13, initialM14, initialM21, initialM22, initialM23, initialM24, initialM31, initialM32, initialM33, initialM34, initialM41, initialM42, initialM43, initialM44) {
            var result = new Matrix();
            result.m[0] = initialM11;
            result.m[1] = initialM12;
            result.m[2] = initialM13;
            result.m[3] = initialM14;
            result.m[4] = initialM21;
            result.m[5] = initialM22;
            result.m[6] = initialM23;
            result.m[7] = initialM24;
            result.m[8] = initialM31;
            result.m[9] = initialM32;
            result.m[10] = initialM33;
            result.m[11] = initialM34;
            result.m[12] = initialM41;
            result.m[13] = initialM42;
            result.m[14] = initialM43;
            result.m[15] = initialM44;
            return result;
        };
        Matrix.Identity = function Identity() {
            return Matrix.FromValues(1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0);
        };
        Matrix.Zero = function Zero() {
            return Matrix.FromValues(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        };
        Matrix.Copy = function Copy(source) {
            return Matrix.FromValues(source.m[0], source.m[1], source.m[2], source.m[3], source.m[4], source.m[5], source.m[6], source.m[7], source.m[8], source.m[9], source.m[10], source.m[11], source.m[12], source.m[13], source.m[14], source.m[15]);
        };
        Matrix.RotationX = function RotationX(angle) {
            var result = Matrix.Zero();
            var s = Math.sin(angle);
            var c = Math.cos(angle);
            result.m[0] = 1.0;
            result.m[15] = 1.0;
            result.m[5] = c;
            result.m[10] = c;
            result.m[9] = -s;
            result.m[6] = s;
            return result;
        };
        Matrix.RotationY = function RotationY(angle) {
            var result = Matrix.Zero();
            var s = Math.sin(angle);
            var c = Math.cos(angle);
            result.m[5] = 1.0;
            result.m[15] = 1.0;
            result.m[0] = c;
            result.m[2] = -s;
            result.m[8] = s;
            result.m[10] = c;
            return result;
        };
        Matrix.RotationZ = function RotationZ(angle) {
            var result = Matrix.Zero();
            var s = Math.sin(angle);
            var c = Math.cos(angle);
            result.m[10] = 1.0;
            result.m[15] = 1.0;
            result.m[0] = c;
            result.m[1] = s;
            result.m[4] = -s;
            result.m[5] = c;
            return result;
        };
        Matrix.RotationAxis = function RotationAxis(axis, angle) {
            var s = Math.sin(-angle);
            var c = Math.cos(-angle);
            var c1 = 1 - c;
            axis.normalize();
            var result = Matrix.Zero();
            result.m[0] = (axis.x * axis.x) * c1 + c;
            result.m[1] = (axis.x * axis.y) * c1 - (axis.z * s);
            result.m[2] = (axis.x * axis.z) * c1 + (axis.y * s);
            result.m[3] = 0.0;
            result.m[4] = (axis.y * axis.x) * c1 + (axis.z * s);
            result.m[5] = (axis.y * axis.y) * c1 + c;
            result.m[6] = (axis.y * axis.z) * c1 - (axis.x * s);
            result.m[7] = 0.0;
            result.m[8] = (axis.z * axis.x) * c1 - (axis.y * s);
            result.m[9] = (axis.z * axis.y) * c1 + (axis.x * s);
            result.m[10] = (axis.z * axis.z) * c1 + c;
            result.m[11] = 0.0;
            result.m[15] = 1.0;
            return result;
        };
        Matrix.RotationYawPitchRoll = function RotationYawPitchRoll(yaw, pitch, roll) {
            return Matrix.RotationZ(roll).multiply(Matrix.RotationX(pitch)).multiply(Matrix.RotationY(yaw));
        };
        Matrix.Scaling = function Scaling(x, y, z) {
            var result = Matrix.Zero();
            result.m[0] = x;
            result.m[5] = y;
            result.m[10] = z;
            result.m[15] = 1.0;
            return result;
        };
        Matrix.Translation = function Translation(x, y, z) {
            var result = Matrix.Identity();
            result.m[12] = x;
            result.m[13] = y;
            result.m[14] = z;
            return result;
        };
        Matrix.LookAtLH = function LookAtLH(eye, target, up) {
            var zAxis = target.subtract(eye);
            zAxis.normalize();
            var xAxis = Vector3.Cross(up, zAxis);
            xAxis.normalize();
            var yAxis = Vector3.Cross(zAxis, xAxis);
            yAxis.normalize();
            var ex = -Vector3.Dot(xAxis, eye);
            var ey = -Vector3.Dot(yAxis, eye);
            var ez = -Vector3.Dot(zAxis, eye);
            return Matrix.FromValues(xAxis.x, yAxis.x, zAxis.x, 0, xAxis.y, yAxis.y, zAxis.y, 0, xAxis.z, yAxis.z, zAxis.z, 0, ex, ey, ez, 1);
        };
        Matrix.PerspectiveLH = function PerspectiveLH(width, height, znear, zfar) {
            var matrix = Matrix.Zero();
            matrix.m[0] = (2.0 * znear) / width;
            matrix.m[1] = matrix.m[2] = matrix.m[3] = 0.0;
            matrix.m[5] = (2.0 * znear) / height;
            matrix.m[4] = matrix.m[6] = matrix.m[7] = 0.0;
            matrix.m[10] = -zfar / (znear - zfar);
            matrix.m[8] = matrix.m[9] = 0.0;
            matrix.m[11] = 1.0;
            matrix.m[12] = matrix.m[13] = matrix.m[15] = 0.0;
            matrix.m[14] = (znear * zfar) / (znear - zfar);
            return matrix;
        };
        Matrix.PerspectiveFovLH = function PerspectiveFovLH(fov, aspect, znear, zfar) {
            var matrix = Matrix.Zero();
            var tan = 1.0 / (Math.tan(fov * 0.5));
            matrix.m[0] = tan / aspect;
            matrix.m[1] = matrix.m[2] = matrix.m[3] = 0.0;
            matrix.m[5] = tan;
            matrix.m[4] = matrix.m[6] = matrix.m[7] = 0.0;
            matrix.m[8] = matrix.m[9] = 0.0;
            matrix.m[10] = -zfar / (znear - zfar);
            matrix.m[11] = 1.0;
            matrix.m[12] = matrix.m[13] = matrix.m[15] = 0.0;
            matrix.m[14] = (znear * zfar) / (znear - zfar);
            return matrix;
        };
        Matrix.Transpose = function Transpose(matrix) {
            var result = new Matrix();
            result.m[0] = matrix.m[0];
            result.m[1] = matrix.m[4];
            result.m[2] = matrix.m[8];
            result.m[3] = matrix.m[12];
            result.m[4] = matrix.m[1];
            result.m[5] = matrix.m[5];
            result.m[6] = matrix.m[9];
            result.m[7] = matrix.m[13];
            result.m[8] = matrix.m[2];
            result.m[9] = matrix.m[6];
            result.m[10] = matrix.m[10];
            result.m[11] = matrix.m[14];
            result.m[12] = matrix.m[3];
            result.m[13] = matrix.m[7];
            result.m[14] = matrix.m[11];
            result.m[15] = matrix.m[15];
            return result;
        };
        return Matrix;
    })();
    BABYLON.Matrix = Matrix;    
})(BABYLON || (BABYLON = {}));

var GriddlGraphics = (function () {
	
	function Graphics() { }
	
	Graphics.POINT = 0;
	Graphics.LINE = 1;
	Graphics.POLYGON = 2;
	Graphics.renderMode = Graphics.LINE;
	Graphics.labelVertexes = false;
	
	var scenes = [];
	var devices = [];
	var RedrawAll = function() { 
		for (var i = 0; i < devices.length; i++)
		{
			Render(devices[i], scenes[i]);
		}
	};
	
	var ParseCoordinates=function(str){var c=str.substr(1,str.length-2).split(','); var p=parseFloat; return new BABYLON.Vector3(p(c[0]),p(c[1]),p(c[2]));};
	var CoordinatesToString = function(v) { return '('+v.x.toString()+','+v.y.toString()+','+v.z.toString()+')'; };
	var Interpolate = function(min, max, gradient) { return min + (max - min) * Clamp(gradient); };
	var Clamp=function(value,min,max){var s='undefined'; if(typeof min===s){min=0;} if(typeof max===s){max=1;} return Math.max(min,Math.min(value,max));};
	
	// Device : { workingContext : Canvas , left : float , top : float , workingWidth : float , workingHeight : float , backBuffer : ImageData , depthBuffer : float[] }
	// Scene : { meshes : Mesh[] , camera : Camera , lights : Light[] }
	// Mesh : { vertices : Vertex[] , polygons : Polygon[] , scale : Vector3 , position : Vector3 , rotation : Vector3 }
	// Polygon : { vertices : Vertex[] }
	// Vertex : { Coordinates : Vector3 , Normal : Vector3 , WorldCoordinates : Vector3 , TextureCoordinates : Vector2 }
	// Texture : { width : int , height : int , internalBuffer : ImageData }
	// Camera : { position : Vector3 , target : Vector3 }
	// Light : { position : Vector3 , color : {r,g,b} , intensity : float , name : string }
	
	Graphics.DrawFrame = function(g, scene, left, top, width, height) {
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
			
			//device.workingContext.fillTextNative(vertexes[i].ToString(), x, y); // 1. vertexes need a toString function   2. where does g come from?
			device.workingContext.fillTextNative(i.toString(), x + 3, y);
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
			if (!inplay1 && !inplay2) { continue; } // this is too aggressive - we could display part of the lines by clamping the points to the visible window
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
			var x = device.left + projectedVertexes[i].Coordinates.x;
			var y = device.top + projectedVertexes[i].Coordinates.y;
			
			//if (x <= device.left || y <= device.top || x >= right || y >= bottom) { continue; } 
			
			device.workingContext.fillCircle(x, y, 2);
			
			if (Graphics.labelVertexes) { device.workingContext.fillTextNative(i.toString(), x + 3, y); }
		}
	};
	var Render = Graphics.Render = function(device, scene) {
		
		if (device.constructor.name == 'Canvas')
		{
			device = new Device(device, 0, 0, device.canvas.width, device.canvas.height);
		}
		
		device.workingContext.clearRect(device.left, device.top, device.workingWidth, device.workingHeight);
		
		if (Graphics.renderMode == Graphics.POLYGON)
		{
			// this fails for SVG, because GriddlCanvas.getImageData passes through to CanvasRenderingContext2D.getImageData
			// maybe we should create a separate canvas for the render, and then convert to base64 and draw it on the page as an image?
			device.backbuffer = device.workingContext.getImageData(device.left, device.top, device.workingWidth, device.workingHeight);
			for (var i = 0; i < device.depthbuffer.length; i++) { device.depthbuffer[i] = 10000000; }
		}
		
		var camera = scene.camera;
		
		var viewMatrix = BABYLON.Matrix.LookAtLH(camera.Position, camera.Target, BABYLON.Vector3.Up());
		
		// PerspectiveFovLH(fov, aspect, znear, zfar)
		// fov = Field of view in the y direction, in radians.
		var projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, device.workingWidth / device.workingHeight, 0.01, 1.0);
		
		var polyfaces = { 3 : [[0, 1, 2]], 4 : [[0, 1, 2], [0, 2, 3]], 5 : [] };
		
		
		//var meshes = scene.meshes; // old
		scene.root.Multiply(BABYLON.Matrix.Identity()); // new
		var meshes = scene.root.Leaves(); // new
		
		for (var i = 0; i < meshes.length; i++)
		{
			// old version
			//var mesh = meshes[i];
			//var scaleMatrix = BABYLON.Matrix.Scaling(mesh.scale.x, mesh.scale.y, mesh.scale.z);
			//var rotationMatrix = BABYLON.Matrix.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
			//var translationMatrix = BABYLON.Matrix.Translation(mesh.position.x, mesh.position.y, mesh.position.z);
			//var worldMatrix = scaleMatrix.multiply(rotationMatrix).multiply(translationMatrix);
			
			// new version: meshes is actually a list of nodes
			var mesh = meshes[i].mesh;
			var worldMatrix = meshes[i].matrix;
			
			var worldView = worldMatrix.multiply(viewMatrix);
			var transformMatrix = worldView.multiply(projectionMatrix);
			
			// the world matrix is passed to Project because we need to know world coordinates (and world normal) for lighting
			
			if (Graphics.renderMode == Graphics.POINT)
			{
				DrawPoints(device, mesh.vertices, transformMatrix, worldMatrix);
			}
			else 
			{
				for (var j = 0; j < mesh.polygons.length; j++)
				{
					var poly = mesh.polygons[j];
					
					if (Graphics.renderMode == Graphics.LINE)
					{
						DrawLinePolygon(device, poly.vertices, transformMatrix, worldMatrix);
					}
					else if (Graphics.renderMode == Graphics.POLYGON)
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
				
				if (Graphics.labelVertexes) { LabelVertexes(device, mesh.vertices, transformMatrix, worldMatrix); }
			}
		}
		
		if (Graphics.renderMode == Graphics.POLYGON)
		{
			device.workingContext.putImageData(device.backbuffer, device.left, device.top);
		}
	};
	
	Graphics.Geometry = {};
	Graphics.Geometry.Line = function(p, q) {
		
		var mesh = new Graphics.Mesh();
		
		mesh.vertices.push(new Vertex(p.x, p.y, p.z));
		mesh.vertices.push(new Vertex(q.x, q.y, q.z));
		
		var polygon = {};
		polygon.vertices = [];
		polygon.vertices.push(mesh.vertices[0]);
		polygon.vertices.push(mesh.vertices[1]);
		mesh.polygons.push(polygon);
		
		return mesh;
	};
	Graphics.Geometry.Cube = function() {
		
		var geometry = new Graphics.Mesh();
		
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
			geometry.vertices.push(vertex);
		}
		
		for (var i = 0; i < polygonArray.length; i++)
		{
			var polygon = {};
			polygon.vertices = [];
			polygon.vertices.push(geometry.vertices[polygonArray[i][0]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][1]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][2]]);
			polygon.vertices.push(geometry.vertices[polygonArray[i][3]]);
			geometry.polygons.push(polygon);
		}
		
		return geometry;
	};
	Graphics.Geometry.Cylinder = function(segments) {
		
		// the length of the cylinder is along the y axis, and the circular part is x-z
		// the cylinder goes from y=0 to y=1, and the radius is 1
		
		// nVertices = segments * 2 + 2
		// nPolygons = segments * 3
		var geometry = new Graphics.Mesh();
		
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
	Graphics.Geometry.Sphere = function(nHemiLatitudeLines, nHemiLongitudeLines) {
		
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
		
		var geometry = new Graphics.Mesh();
		
		geometry.vertices = points;
		geometry.polygons = polygons;
		
		return geometry;
	};
	
	// BABYLON.Matrix.Scaling(x, y, z)
	// BABYLON.Matrix.Translation(x, y, z)
	// BABYLON.Matrix.RotationYawPitchRoll(x, y, z)
	
	// circle : { radius : float , normal : {x,y,z} , center : {x,y,z} }
	// ellipse : { cx : float , cy : float , majorAxis : float , minorAxis : float , rotation : radians }
	// box : { center : {x,y,z} , u : {x,y,z} , v : {x,y,z} }
	// ProjectCircle : circle -> ellipse
	// drawBox : box -> 'M 0 0 L 0 0 L 0 0 L 0 0 z'
	// circleFromBox : circle -> box
	
	Graphics.ProjectCircle = function(circle) {
		
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
	
	var Init = Graphics.Init = function() {
		
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
	var ReadMesh = Graphics.ReadMesh = function(vertices, polygons, uvPatches) {
		
		var mesh = new Graphics.Mesh(null, vertices.length, polygons.length);
		
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
			var camera = new Graphics.Camera();
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
			var device = new Graphics.Device(canvas[0], left, top);
			scenes.push(scene);
			devices.push(device); // this is a closure variable - Graphics.devices is a list that is referenced by Graphics.RedrawAll()
		}
	};
	
	
	var Node = Graphics.Node = (function() {
		
		function Node(mesh) {
			
			// mesh xor children
			if (mesh)
			{
				this.mesh = mesh; // Mesh or Light or Camera
				this.children = null; // [ Node ]
			}
			else
			{
				this.mesh = null;
				this.children = [];
			}
			
			//this.parent = null;
			
			this.transforms = [];
			this.matrix = null; // matrixes are multiplied from the top down and cached here
		}
		
		Node.prototype.Leaves = function() {
			
			var list = [];
			
			if (this.mesh)
			{
				list.push(this);
			}
			
			if (this.children)
			{
				for (var i = 0; i < this.children.length; i++)
				{
					list = list.concat(this.children[i].Leaves());
				}
			}
			
			return list;
		};
		
		// to calculate the whole scene, we do root.Multiply(identityMatrix)
		Node.prototype.Multiply = function(parent) {
			
			this.matrix = parent;
			
			for (var i = 0; i < this.transforms.length; i++)
			{
				this.matrix = this.matrix.multiply(this.transforms[i]);
			}
			
			if (this.children)
			{
				for (var i = 0; i < this.children.length; i++)
				{
					this.children[i].Multiply(this.matrix);
				}
			}
		};
		
		return Node;
	})();
	
	var Vertex = Graphics.Vertex = (function () {
		
		function Vertex(x, y, z) {
			this.Coordinates = new BABYLON.Vector3(x, y, z);
			this.Normal = new BABYLON.Vector3(0, 0, 0);
			this.WorldCoordinates = new BABYLON.Vector3(0, 0, 0);
			this.TextureCoordinates = null; // BABYLON.Vector2
		}
		
		return Vertex;
	})();
	var Polygon = Graphics.Polygon = (function () {
		
		function Polygon() {
			this.vertices = []; // [ Vertex ]
			this.uvs = null; // [ BABYLON.Vector2 ] - if uvs is null, the polygon gets its uv's from the underlying vertices
		}
		
		return Polygon;
	})();
	var Mesh = Graphics.Mesh = (function () {
		
		function Mesh() {
			this.name = null;
			this.vertices = [];
			this.polygons = [];
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
	
	var Camera = Graphics.Camera = (function () {
		
		function Camera() {
			this.Position = BABYLON.Vector3.Zero();
			this.Target = BABYLON.Vector3.Zero();
		}
		
		return Camera;
	})();
	var Texture = Graphics.Texture = (function () {
		
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
	
	var Scene = Graphics.Scene = (function() {
		
		function Scene(root) {
			this.root = root;
			this.camera = new Camera();
		}
		
		Scene.prototype.setCameraPositionVector = function(vector) { this.camera.Position = vector };
		Scene.prototype.setCameraPosition = function(x, y, z) { this.camera.Position = new BABYLON.Vector3(x, y, z); };
		Scene.prototype.setCameraTarget = function(x, y, z) { this.camera.Target = new BABYLON.Vector3(x, y, z); };
		
		return Scene;
	})();
	
	// device does need to be separate from canvas, because we need to be able to restrict drawing to a subset of the canvas
	// also, this whole file really needs to be made Griddl.Canvas-agnostic.  or appropriate shims added to Griddl.Canvas to present an identical interface
	var Device = Graphics.Device = (function() {
	
		function Device(canvas, left, top, width, height) {
			
			if (canvas.constructor.name == 'CanvasRenderingContext2D')
			{
				this.workingContext = canvas;
			}
			else if (canvas.constructor.name == 'Canvas')
			{
				//this.workingContext = canvas.g;
				this.workingContext = canvas;
			}
			else if (canvas.constructor.name == 'HTMLCanvas')
			{
				this.workingContext = canvas.getContext('2d');
			}
			else
			{
				throw new Error();
			}
			
			this.left = left;
			this.top = top;
			this.workingWidth = width;
			this.workingHeight = height;
			
			this.depthbuffer = new Array(this.workingWidth * this.workingHeight);
		};
		
		return Device;
	})();
	
	Graphics.Centroid = function(mesh) {
		
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
	
	Graphics.OrbitControls = function(device, scene) {
		
		// this assumes the camera target is (0,0,0) - we need to generalize it so that it orbits around the camera target
		
		var savedRenderMode = null;
		
		var canvas = null;
		
		if (device.constructor.name == 'Device')
		{
			canvas = $(device.workingContext.canvas);
		}
		else if (device.constructor.name == 'Canvas')
		{
			canvas = $(device.canvas);
		}
		else
		{
			throw new Error();
		}
		
		canvas.off('mousedown');
		
		canvas.on('mousedown', function(downEvent) {
			
			savedRenderMode = Graphics.renderMode;
			Graphics.renderMode = Graphics.POINT;
			
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
				Graphics.Render(device, scene);
			});
			
			canvas.on('mouseup', function(upEvent) { canvas.off('mousemove'); Graphics.renderMode = savedRenderMode; Graphics.Render(device, scene); });
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
			Graphics.Render(device, scene);
		});
	};
	
	return Graphics;
	
})();

// var Griddl = (Griddl || {});

if (typeof window != 'undefined')
{
	Griddl.Graphics = GriddlGraphics;
}
else
{
	exports.Graphics = GriddlGraphics;
	exports.BABYLON = BABYLON;
}

