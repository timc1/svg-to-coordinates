"use strict";

/**
 * Points's constructor
 * @constructor
 */
function Point (x,y) {
    this.x = x || 0;
    this.y = y || 0;
}

/**
 * Set x
 * @param {Number} x
 */
Point.prototype.setX = function setX(x) {
    this.x = x;
};

/**
 * Set Y
 * @param {Number} y
 */
Point.prototype.setY = function setY(y) {
    this.y = y;
};

/**
 * Return if the point is inside a polygon or not
 * @param   {[Point]} points
 * @returns {Boolean}
 */
Point.prototype.isInside = function isInside(points) {
    var i, j, c = false;
    for( i = 0, j = points.length-1; i < points.length; j = i++ ) {
        if( ( ( points[i].y > this.y ) != ( points[j].y > this.y ) ) &&
            ( this.x < ( points[j].x - points[i].x ) * ( this.y - points[i].y ) / ( points[j].y - points[i].y ) + points[i].x ) ) {
            c = !c;
        }
    }
    return c;
};

/**
 * Return the nearest point and its index of the point
 * @param   {[Point]}   points
 * @returns {Object}    nearestPoint, itsIndex
 */
Point.prototype.findNearest = function findNearest(points){
    var minDist  = 0,
        ind      = 0,
        neareast = new Point();

    points.forEach(function (point, pi){
        var distCur  = Math.sqrt(Math.pow(this.x-point.x, 2)+Math.pow(this.y-point.y, 2));
        minDist      = distCur <= minDist ? distCur : (pi == 0 ? distCur : minDist);
        neareast     = distCur <= minDist ? point : nearest;
        ind          = distCur <= minDist ? pi : ind;
    },this);

    return {point : neareast, ind : ind};
};


module.exports = Point;
