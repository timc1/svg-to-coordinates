"use strict";

var Point = require (__dirname + '/point');

/**
 * Polygon's constructor
 * @constructor
 */
function Polygon (layer, numberPoints, points) {
    this.layer        = layer || 'defaultLayer';
    this.numberPoints = numberPoints || 0;
    this.points       = points || [];
}

/**
 * Set the layer
 * @param {String}  layer
 */
Polygon.prototype.setLayer = function setLayer(layer) {
    this.layer = layer;
};

/**
 * Set the number of points
 * @param {int} numberPoints
 */
Polygon.prototype.setNumberPoints = function setNumberPoints(numberPoints) {
    this.numberPoints = numberPoints;
};

/**
 * Add a point to the polygon
 * @param  point
 */
Polygon.prototype.addPoint = function addPoint(point) {
    this.points.push(point);
};

/**
 * Return the point witch is on the center of the points in tabPoints
 * @returns {Point}   center
 */
Polygon.prototype.getCenter = function getCenter(){

    var min     = new Point(),
        max     = new Point(),
        center  = new Point();

    this.points.forEach(function (point, pi){
        min.x=point.x<min.x ? point.x : (pi == 0 ? point.x : min.x);
        min.y=point.y<min.y ? point.y : (pi == 0 ? point.y : min.y);
        max.x=point.x>max.x ? point.x : (pi == 0 ? point.x : max.x);
        max.y=point.y>max.y ? point.y : (pi == 0 ? point.y : max.y);
    });
    center.x = (min.x + max.x)/2;
    center.y = (min.y + max.y)/2;

    return center;
};

module.exports = Polygon;