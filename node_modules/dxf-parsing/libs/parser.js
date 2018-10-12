'use strict';

var   byline     = require("byline"),
      fs         = require("fs"),
      Polygon    = require (__dirname + "/elements/polygon"),
      Circle     = require (__dirname + "/elements/circle"),
      Text       = require (__dirname + "/elements/text"),
      Point      = require (__dirname + "/elements/point");

var Parser = {};

/**
 * Transform a dxf file into an array where keys are the names of dxf sections
 * @param {String}     dxfPath     "path/of/dxf/file"
 * @param {Function}   callback    Callback function
 */
Parser.toArray = function (dxfPath, callback) {

    var stream         = byline(fs.createReadStream(dxfPath, { encoding: 'utf8' })),
        sectionNameTab = ['HEADER', 'CLASSES', 'TABLES', 'BLOCKS', 'ENTITIES', 'OBJECTS', 'THUMBNAILIMAGE'],
        sectionCur     = '',
        dxfTab         = [],
        section        = false,
        endsec         = false;

    stream.on('data', function (line) {
        if (sectionNameTab.indexOf(line) != -1) {
            sectionCur = line.toLowerCase();
            section = true;
            dxfTab[sectionCur] = [];
            endsec = false;
        }
        else if (section === true) {
            if (line === 'ENDSEC') {
                endsec = true;
                section = false;
                sectionCur = '';
            }
            else if (endsec === false) {
                dxfTab[sectionCur].push(line);
            }
        }
    });
    stream.on('error', function (error) {
        callback(error);   
    });
    stream.on('end', function () {
        callback(null, dxfTab);
    });
};

/**
 * Get the polygons in the DXF file
 * @param   {Array}   sectionTab      Polygons are in the entities section
 * @returns {Array}   polygons        An array of polygons
 */
Parser.getPolygons = function (sectionTab) {

    var polygons    = [],
        polygon     = undefined,
        sectionTab  = sectionTab.entities,
        polygonBool = false;

    sectionTab.forEach(function (line, li) {
        if (line === 'LWPOLYLINE') {
            polygonBool = true;
            polygon    = new Polygon();
        }
        else if (polygonBool === true && line === '  8') polygon.setLayer(sectionTab[li + 1]);
        else if (polygonBool === true && line === ' 90') polygon.setNumberPoints(parseInt(sectionTab[li + 1]));
        else if (polygonBool === true && line === ' 10') {
            var point = new Point();
            point.setX(parseFloat(sectionTab[li + 1]));
            point.setY(parseFloat(sectionTab[li + 3]));
            polygon.addPoint(point);
        }
        else if (
            polygonBool === true &&
            polygon.numberPoints !== 0 &&
            polygon.layer !== 'defaultLayer' &&
            polygon.points.length === polygon.numberPoints
         ){
            polygonBool = false;
            polygons.push(polygon);
         }
    });
    return polygons;
};

/**
 * Get the circles in the DXF file
 * @param   {Array}     sectionTab      Circles are in the entities section
 * @param   {boolean}   toPolygon       true if you want to transforrm directly the circles into polygons
 * @returns {Array}     circles         An array of circles
 */
Parser.getCircles = function (sectionTab, toPolygon){

    var circles             = [],
        polygonFromCircle   = undefined,
        circle              = undefined,
        sectionTab          = sectionTab.entities,
        toPolygon           = toPolygon || false,
        circleBool          = false;

    sectionTab.forEach(function (line, li){
        if(line === 'CIRCLE'){
            circleBool = true;
            circle = new Circle();
        }
        else if(circleBool === true && line === '  8') circle.setLayer(sectionTab[li+1]);
        else if(circleBool === true && line === ' 10') {
            var point = new Point();
            point.setX(parseFloat(sectionTab[li + 1]));
            point.setY(parseFloat(sectionTab[li + 3]));
            circle.setPoint(point);
        }
        else if(circleBool === true && line === ' 40') circle.setRayon(sectionTab[li+1]);
        else if(
            circleBool === true &&
            circle.layer !== 'defaultLayer' &&
            circle.point !== undefined &&
            circle.rayon !== 0
        ){
            circleBool = false;
            if (toPolygon){
                polygonFromCircle = circle.toPolygon();
                circles.push(polygonFromCircle);
            }
            else circles.push(circle);
        }
    });
    return circles;
};

/**
 * Get the texts in the DXF file
 * @param   {Array}    sectionTab         The texts are in the entities section
 * @param   {boolean}  contentsParse      true if you want to parse the content of text
 * @returns {Array}    texts              An array of texts
 */
Parser.getTexts = function (sectionTab, contentsParse){

    var texts         = [],
        text          = undefined,
        sectionTab    = sectionTab.entities,
        contentsParse = contentsParse || false,
        textBool      = false;

    sectionTab.forEach(function (line, li){
        if(line == 'TEXT' || line == 'MTEXT'){
            textBool = true;
            text = new Text();
        }
        else if(textBool == true && line == '  8') text.setLayer(sectionTab[li+1]);
        else if(textBool == true && line == ' 10') {
            var point = new Point();
            point.setX(parseFloat(sectionTab[li + 1]));
            point.setY(parseFloat(sectionTab[li + 3]));
            text.setPoint(point);
        }
        else if(textBool == true && line == '  1') {
            text.setContents(sectionTab[li+1]);
            if(contentsParse) text.contentsParse();
        }
        else if(
            textBool == true &&
            text.layer != 'defaultLayer' &&
            text.contents != 'defaultContents' &&
            text.point != undefined

        ){
            textBool = false;
            if(text.contents !== '') texts.push(text);
        }
    });
    return texts;
};

/**
 * Get Parameters : the origin point of the view, its center point and its rotate angle
 * @param   {Array}    sectionTab     The parameters are in the tables section
 * @returns {Object}   params         originPoint, viewCenterPoint, rotateAngle
 */
Parser.getParameters = function (sectionTab) {

    var params     = {originPoint: undefined, viewCenterPoint: undefined, rotateAngle: undefined},
        sectionTab = sectionTab.tables,
        vPort      = false;

    sectionTab.forEach(function (line, li) {
        if (line == 'AcDbViewportTableRecord') vPort = true;

        else if (vPort == true && line == ' 12'){
            var viewCenterPoint = new Point();
            viewCenterPoint.setX(parseFloat(sectionTab[li + 1]));
            viewCenterPoint.setY(parseFloat(sectionTab[li + 3]));
            params.viewCenterPoint = viewCenterPoint;
        }
        else if (vPort == true && line == ' 13'){
            var originPoint = new Point();
            originPoint.setX(parseFloat(sectionTab[li + 1]));
            originPoint.setY(parseFloat(sectionTab[li + 3]));
            params.originPoint = originPoint;
        }
        else if (vPort == true && line == ' 51') params.rotateAngle = parseFloat(sectionTab[li + 1]);
        else if (
            vPort == true && params.rotateAngle != undefined &&
            params.originPoint != undefined &&
            params.viewCenterPoint != undefined)
        {
            vPort = false;
        }
    });
    return params;
};

/**
 * Get the layers of the appropriate entities in the DXF file
 * @param    {Array}    sectionTab     The specific layers are in the entities section
 * @param    {Array}    tabEnt         You can put "text","polygon" or "circle" in the tabEnt (all by default)
 * @returns  {Array}    layers
 */
Parser.getLayersByEntities = function (sectionTab, tabEnt){

    var layers     = [],
        tabTmp     = tabEnt || 'all',
        ent        = false;

    if(tabTmp === 'all') layers = Parser.getAllLayers(sectionTab);
    else{
        var sectionTab = sectionTab.entities,
            tabEnt     = [];

        if (tabTmp.indexOf("text") !== -1) tabEnt.push("MTEXT", "TEXT");
        if (tabTmp.indexOf("polygon") !== -1) tabEnt.push("LWPOLYLINE");
        if (tabTmp.indexOf("circle") !== -1) tabEnt.push("CIRCLE");

        sectionTab.forEach(function (line, li){
            if(tabEnt.indexOf(line) !== -1) ent = true;
            else if(ent === true && line == '  8'){
                if(layers.indexOf(sectionTab[li+1]) === -1) layers.push(sectionTab[li+1]);
            }
        });
    }
    return layers;
};

/**
 * Get all layers of the DXF file
 * @param   {Array}    sectionTab     All layers are in the tables section
 * @returns {Array}    layer
 */
Parser.getAllLayers = function (sectionTab){

    var layers       = [],
        sectionTab   = sectionTab.tables,
        getLayer     = false;

    sectionTab.forEach(function (line, li){
        if(line === "AcDbLayerTableRecord") getLayer = true;
        else if(getLayer === true && line === '  2'){
            if(layers.indexOf(sectionTab[li+1]) === -1){
                layers.push(sectionTab[li+1]);
                getLayer = false;
            }
        }
    });
    return layers;
};

/**
 * Established a mapping between polygons and texts
 * @param    {object}    polygons
 * @param    {object}    texts
 * @returns  {Array}     mapping
 */
Parser.makeMappings = function (polygons, texts){

    var mappings = [];

    texts.forEach(function (text){
        polygons.forEach(function (polygon, p){
            if(polygon.points !== undefined){
                if(text.point.isInside(polygon.points)){
                    if(!mappings[p]) mappings[p] = {polygon : polygon, texts : [text]};
                    else mappings[p].texts.push(text);
                }
            }
        });
    });
    return mappings;
};

/**
 * Get the polygons of the DXF file which does not have text
 * @param   {Array}  polygons
 * @param   {Array}  texts
 * @returns {Array}  polygonWithoutText
 */
Parser.getPolygonsWithoutText = function (polygons, texts){

    var polygonWithoutText = [];

    polygons.forEach(function(polygon){

        var textInPolygon = [];

        texts.forEach(function (text, t){
            if(polygon.points !== undefined){
                if(text.point.isInside(polygon.points)) textInPolygon.push(t);
            }
        });
        if (textInPolygon.length === 0) polygonWithoutText.push(polygon);
    });
    return polygonWithoutText;
};

/**
 * Get the Texts of the DXF file which does not have polygon
 * @param   {Array}  texts
 * @param   {Array}  polygons
 * @returns {Array}  textsWithoutPolygon
 */
Parser.getTextsWithoutPolygon = function (texts, polygons){

    var textsWithoutPolygon = [];

    texts.forEach(function(text){

        var polygonWithText = [];

        polygons.forEach(function (polygon, p){
            if(polygon.points !== undefined){
                if(text.point.isInside(polygon.points)) polygonWithText.push(p);
            }
        });
        if (polygonWithText.length === 0) textsWithoutPolygon.push(text);
    });
    return textsWithoutPolygon;
};

/**
 * Return the min x,z  and the max x,y of the polygon's array
 * @param   {Array}     polygons
 * @returns {Object}    {min: point, max: point}
 */
Parser.getDimensions = function (polygons){

    var minPoint = new Point(),
        maxPoint = new Point();

    polygons.forEach(function (polygon, p) {
        polygon.points.forEach(function (tpoint, i) {
            minPoint.x = tpoint.x < minPoint.x ? tpoint.x : (i === 0 && p === 0 ? tpoint.x : minPoint.x);
            minPoint.y = tpoint.y < minPoint.y ? tpoint.y : (i === 0 && p === 0 ? tpoint.y : minPoint.y);
            maxPoint.x = tpoint.x > maxPoint.x ? tpoint.x : (i === 0 && p === 0 ? tpoint.x : maxPoint.x);
            maxPoint.y = tpoint.y > maxPoint.y ? tpoint.y : (i === 0 && p === 0 ? tpoint.y : maxPoint.y);
        });
    });
    return {
        'min': minPoint,
        'max': maxPoint
    }
};

module.exports = Parser;
