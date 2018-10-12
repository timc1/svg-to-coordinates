"use strict";

var Polygon = require (__dirname + '/polygon'),
    Point   = require (__dirname + '/point');

/**
 * Circle's constructor
 * @constructor
 */
function Circle (layer, rayon, point) {
    this.layer  = layer || 'defaultLayer';
    this.rayon  = rayon || 0;
    this.point  = point || undefined;
}

/**
 * Set the layer
 * @param {String}  layer
 */
Circle.prototype.setLayer = function setLayer(layer) {
    this.layer = layer;
};

/**
 * Set the rayon of circle
 * @param {Number} rayon
 */
Circle.prototype.setRayon = function setRayon(rayon) {
    this.rayon = rayon;
};

/**
 * Set the center point of circle
 * @param  point
 */
Circle.prototype.setPoint = function setPoint(point) {
    this.point = point;
};


/**
 * Transform circle into polygon
 * @param   {int}       nbSides is an option
 * @returns {Polygon}   polygon
 */
Circle.prototype.toPolygon = function toPolygon(nbSides){
    var nbSides   = nbSides || 20,
        angSplit  = Math.PI/(nbSides/2),
        polygon   = new Polygon();

    polygon.setLayer(this.layer);
    polygon.setNumberPoints(nbSides);

    for (var angCur = 0; angCur <= 2*Math.PI; angCur += angSplit){
        var point = new Point();
        point.setX(this.point.x + (this.rayon*Math.cos(angCur)));
        point.setY(this.point.y + (this.rayon*Math.sin(angCur)));
        polygon.addPoint(point);
    }
    return polygon;
};


module.exports = Circle;