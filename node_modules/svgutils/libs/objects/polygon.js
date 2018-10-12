'use strict';

var Matrix      = require(__dirname + '/../matrix/extends'),
    SvgObject   = require(__dirname + '/svgobject'),
    utils       = require(__dirname + '/../matrix/utils'),
    _           = require('underscore'),
    nUtil       = require('util');

var EPSILON = 0.1;

var Polygon = function() {
    if (!(this instanceof Polygon)) {
        throw 'this function in a constructor. Use new to call it';
    }

    SvgObject.call(this);
    this.type   = "polygon";
    this.points = [];
};

nUtil.inherits(Polygon, SvgObject);

/**
 * Get Polygon points in Array to simply manipulation
 *
 * @param {string}    points                    Polygon|Polyline points attribute value
 */
Polygon.prototype.setPointsFromString = function setPointsFromString(points) {
    var coords          = [],
        point           = {},
        previousPoint   = {};

    points = points.replace(/ +(?= )/g, '');
    _.each(points.split(/[, ]/), function (xy, index) {
        if (index%2 == 0) {
            point.x = xy;
        } else {
            point.y = xy;
        }

        if (index%2 == 1 && index > 0 && (point.x !== previousPoint.x || point.y !== previousPoint.y)) {
            coords.push(point);
            previousPoint = point;
            point = {};
        }
    });

    this.points = coords;
    this.bbox   = undefined;
};

Polygon.prototype.addPoint = function addPoint(x, y) {
    var different = true;
    if (this.points.length > 0) {
        var lastPoint = this.points[this.points.length-1];
        different = lastPoint.x !== x || lastPoint.y !== y;
    }
    if (different) {
        this.points.push({ x : x, y : y });
    }
    this.bbox = undefined;
};

/**
 * Return JSON from object
 * @param   {boolean}    [matrix]       return transform attribute if false.
 * @returns {object}                    JSON Object
 */
Polygon.prototype.toJSON = function toJSON(matrix) {
    var parentJSON = SvgObject.prototype.toJSON.call(this, matrix);

    parentJSON.type     = this.type;
    parentJSON.points   = this.points;

    return parentJSON;
};

/**
 * Return XML from object
 * @param   {boolean}    [matrix]       return transform attribute if false.
 * @returns {xmlBuilder}                XML Object
 */
Polygon.prototype.toXml = function toXml(matrix) {

    var xml = SvgObject.prototype.toXml.call(this, matrix);

    var points = "";
    _.each(this.points, function (point) {
       points += point.x + "," + point.y + " ";
    });

    xml.att('points', points.substr(0, points.length-1));

    return xml;
};

/**
 * Return element converted into Path.
 * @return {Path}                           Path Object
 */
Polygon.prototype.toPath = function toPath() {
    var path = SvgObject.prototype.toPath.call(this);

    path.d =  "";
    this.points.forEach(function(point, index) {
        if(index == 0){
            path.d += "M " + point.x + " " + point.y;
        } else {
            path.d += " L" + point.x + " " + point.y
        }
    });
    path.d += ' Z';

    return path;
};

Polygon.prototype.applyMatrix = function applyMatrix(matrix, callback) {
    var polygon     = new Polygon();
    polygon.style   = this.style;
    polygon.classes = this.classes;
    polygon.id      = this.id;
    polygon.name    = this.name;
    polygon.stroke  = this.stroke;
    polygon.fill    = this.fill;
    polygon.type    = this.type;
    polygon.data    = this.data;

    _.each(this.points, function (point) {
        polygon.addPoint(
            matrix.x(point.x, point.y),
            matrix.y(point.x, point.y)
        );
    });

    callback(polygon);
};

/**
 * Get the element Bounding Box
 * @param {function} callback               Callback Function
 */
Polygon.prototype.getBBox = function getBBox(callback) {
    var minX = +Infinity,
        maxX = -Infinity,
        minY = +Infinity,
        maxY = -Infinity;

    _.each(this.points, function (point) {
        minX = Math.min(point.x, minX);
        maxX = Math.max(point.x, maxX);
        minY = Math.min(point.y, minY);
        maxY = Math.max(point.y, maxY);
    });


    this.bbox = utils.bbox(minX, minY, Math.abs(Math.abs(maxX) - Math.abs(minX)), Math.abs(Math.abs(maxY) - Math.abs(minY)));
    callback(this.bbox);
};

/**
 * Get the element innerBox
 * @param {function} callback               Callback function
 */
Polygon.prototype.getInnerBox = function getInnerBox(callback) {
    var verticesY       = [],
        pointsCount     = this.points.length,
        segments        = [],
        prevY           = Infinity,
        innerRect       = {
            x       : 0,
            y       : 0,
            width   : 0,
            height  : 0
        },
        segment;

    function calculAires( matrix, xKeys, yKeys ) {
        var nbInside   = 0;
        var nbOutside  = 0;
        // parcours les lignes
        for(var i in xKeys) {
            for(var j in yKeys) {
                if( matrix[ xKeys[i] ] ) {
                    if( matrix[ xKeys[i] ][ yKeys[j] ] == 1 ) nbInside++;
                    else if( matrix[ xKeys[i] ][ yKeys[j] ] == 0 ) nbOutside++
                }
            }
        }
        return { inside : nbInside, outside : nbOutside };
    }

    function pointIsInside( point, polyPoints ) {
        var c = false;
        var i = 0, j=0;
        for (i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            if ((( arrondi(polyPoints[i].y) > arrondi(point.y) ) != ( arrondi(polyPoints[j].y) > arrondi(point.y))) &&
                ( arrondi(point.x) <
                    ( arrondi(polyPoints[j].x) - arrondi(polyPoints[i].x) ) * ( arrondi(point.y) - arrondi(polyPoints[i].y)) / (arrondi(polyPoints[j].y) - arrondi(polyPoints[i].y)) +
                        arrondi(polyPoints[i].x))) {
                c = !c;
            }
        }
        return c;
    }

    function makeMatrix( points, box ) {
        var matrix = [];
        var yKeys  = [];
        var xKeys  = [];
        var first = true;
        for(var i=arrondi(box.x); i< box.x + (box.width + offsetX);  i = arrondi(i+offsetX) ) {
            for(var j=arrondi(box.y); j< box.y + (box.height + offsetY); j= arrondi(j+offsetY) ){
                if( !_.isArray(matrix[i]) ) matrix[i] = [];
                matrix[i][j] = pointIsInside( {x:i, y:j}, points ) == true ? 1 : 0;
                if( first == true ) yKeys.push(j);
            }
            first = false;
            xKeys.push(i);
        }
        return {matrix:matrix, xKeys:xKeys, yKeys:yKeys};
    }

    function matrixToRect (matrix) {
        var x = 99999;
        var y = 99999;
        var maxX = 0;
        var maxY = 0;
        var width  = 0;
        var height = 0;
        for(var i in xKeys) {
            for(var j in yKeys) {
                if(matrix[ xKeys[i] ]) {
                    if( matrix[ xKeys[i] ][ yKeys[j] ] ) {
                        y = Math.min(y, yKeys[j] );
                        maxY = Math.max(maxY, yKeys[j] );
                    }
                    x = Math.min(x, xKeys[i] );
                    maxX = Math.max(maxX, xKeys[i] );
                }
            }
        }
        return {x: x,
            y: y,
            width: arrondi(maxX - x),
            height: arrondi(maxY - y) };
    }

    function deleteRow( matrix, xKeys, yKeys, x, y, from ) {
        var newMatrix       = matrix;
        var find            = false;
        _.each(xKeys, function( i ){
            _.each(yKeys, function( j ){
                if( x == 0 && j == y) {
                    if(newMatrix[i]) newMatrix[i][j]= null;
                    find = true;
                }
            });
            if( y == 0 && i == x) {
                newMatrix[i] = null;
                find = true;
            }
        });
        if( find == true && x == 0 && from == 'top') {
            ryKeys = _.without(ryKeys, y);
            yKeys = _.without(yKeys, y);
        }
        if( find == true && y == 0 && from == 'right') {
            rxKeys = _.without(rxKeys, x);
            xKeys = _.without(xKeys, x);
        }
        if( find == true && x == 0 && from == 'bottom') {
            yKeys = _.without(yKeys, y);
            ryKeys = _.without(ryKeys, y);
        }
        if( find == true && y == 0 && from == 'left') {
            rxKeys = _.without(rxKeys, x);
            xKeys = _.without(xKeys, x);
        }
        return;
    }

    function differenceAire( matrix, xKeys, yKeys, i, direction) {
        var beforeAire = calculAires( matrix, xKeys, yKeys );
        if( direction=='top' || direction=='bottom') deleteRow( matrix, xKeys, yKeys, 0, i, direction );
        else deleteRow( matrix, xKeys, yKeys, i, 0, direction );
        var newAire = calculAires( matrix, xKeys, yKeys );
        if( ((beforeAire.inside - newAire.inside) > (precision*(beforeAire.outside - newAire.outside))) ) {
            return true;
        } else return false;
    }

    function arrondi( item) {
        return Math.round( item *1000) / 1000;
    }

    var points   = this.points;
    var minX = +Infinity,
        maxX = -Infinity,
        minY = +Infinity,
        maxY = -Infinity;

    _.each(this.points, function (point) {
        minX = Math.min(point.x, minX);
        maxX = Math.max(point.x, maxX);
        minY = Math.min(point.y, minY);
        maxY = Math.max(point.y, maxY);
    });
    var box  = utils.bbox(minX, minY, Math.abs(Math.abs(maxX) - Math.abs(minX)), Math.abs(Math.abs(maxY) - Math.abs(minY)));

    if (box.width <= 0.1 || box.height <= 0.1 ) {
        callback({
            x: 0,
            y: 0,
            width: 0,
            height: 0
        });
        return;
    }

    var offsetX             = arrondi(box.width / 40);
    var offsetY             = arrondi(box.height / 40);
    var getMatrixParams     = makeMatrix( points, box );

    var matrix    = getMatrixParams.matrix;
    var xKeys     = getMatrixParams.xKeys;
    var yKeys     = getMatrixParams.yKeys;
    var rxKeys    = _.sortBy(xKeys, function (name) {return name}).reverse();
    var ryKeys    = _.sortBy(yKeys, function (name) {return name}).reverse();

    var originalrxKeys = JSON.parse(JSON.stringify(rxKeys));
    var originalryKeys = JSON.parse(JSON.stringify(ryKeys));

    var precision = 0.7;

    // on elimine les lignes par le haut

    for(var i in originalryKeys) {
        if( differenceAire(matrix, xKeys, yKeys, originalryKeys[i], 'top') ) break;
    }

    // on elimine les lignes par la droite
    for( var i in originalrxKeys ) {
        if( differenceAire(matrix, xKeys, yKeys, originalrxKeys[i], 'right') ) break;
    }

    // on elimine les lignes par le bas
    for( var i in yKeys ) {
        if( differenceAire(matrix, xKeys, yKeys, yKeys[i], 'bottom') ) break;
    }
    // on elimine les lignes par la gauche
    for( var i in xKeys ) {
        if( differenceAire(matrix, xKeys, yKeys, xKeys[i], 'left') ) break;
    }

    innerRect = matrixToRect(matrix);

    // cas spécifique non gérer par l'algo
    // on enleve un quart de l'outerbox
    if( innerRect.x == 99999 &&
        innerRect.y == 99999 &&
        innerRect.width == -99999 &&
        innerRect.height == -99999) {

        var deltaQuarterX = box.width / 4;
        var deltaQuarterY = box.height / 4;

        innerRect.x         = box.x + deltaQuarterX;
        innerRect.y         = box.y + deltaQuarterY;
        innerRect.width     = box.width - deltaQuarterX;
        innerRect.height    = box.height - deltaQuarterY;
    }

    callback(innerRect);
};


/**
 * Get segment at specific Y coordinate
 * @param {number} y            Y coordinate
 * @returns {{x: number, y: number, width: number}}
 * @private
 */
Polygon.prototype._widestSegmentAtY = function _widestSegmentAtY(y) {
    var segment = {
            x : 0,
            y : y,
            width : 0
        },
        pointsCount = this.points.length,
        xArray      = [],
        i, j;

    if (pointsCount < 3) {
        return segment;
    }

    // compute all the intersections (x coordinates)
    for (i = 0,  j = pointsCount-1; i < pointsCount; j = i++) {
        var point1 = this.points[i],
            point2 = this.points[j];
        if ((point1.y > y) != (point2.y > y)) {
            if (Math.abs(point2.x - point1.x) < EPSILON) {
                xArray.push(point1.x);
            } else {
                // y = a x + b
                var a = (point2.y - point1.y)/(point2.x - point1.x),
                    b = point2.y - a * point2.x,
                    x = (y - b)/a;
                if (x >= Math.min(point2.x, point1.x) && x <= Math.max(point2.x, point1.x)) {
                    xArray.push(x);
                }
            }
        }
    }

    xArray = _.sortBy(xArray, function (x) {
        return x;
    });

    for (i = 0, j = 1; j < xArray.length; i+=2, j+=2) {
        var width = xArray[j] - xArray[i];
        if (width > segment.width) {
            segment.x = xArray[i];
            segment.width = width;
        }
    }

    return segment;
};

module.exports = Polygon;

/**
 * Create Polygon from SVG polygon|polyline node
 *
 * @param   {object}    node        xml2js node from SVG file
 * @param   {boolean}   [line]      true : polyline, false : polygon. False as default
 * @returns {Polygon}               the polygon object
 */
module.exports.fromNode = function fromNode(node, line) {
    var polygon = new Polygon();

    if (line == true) {
        polygon.type = 'polyline';
    }
    if (typeof node != 'undefined' && typeof node.$ != 'undefined') {
        SvgObject.fromNode(polygon, node);

        if (typeof node.$.points != 'undefined') {
            polygon.setPointsFromString(node.$.points);
        }
    }

    return polygon;
};

/**
 * Create Polygon From JSON object
 * @param   {object}    json            JSON polygon Object
 * @param   {boolean}   line            True : polyline, false : polygon
 * @returns {Polygon}
 */
module.exports.fromJson = function fromJson(json, line) {

    var polygon = new Polygon();

    if (line == true) {
        polygon.type = 'polyline';
    }
    if (typeof json != 'undefined') {
        SvgObject.fromJson(polygon, json);

        if (typeof json.points != 'undefined') {
            polygon.points = json.points;
        }
    }

    return polygon;
};