dxf-parsing
========

dxf-parsing is made to parse dxf files : polygons, texts, circles ...

## Install

```
npm install dxf-parsing
```

## Usage

```javascript
var dxfParsing = require('dxf-parsing');

var dxf       = dxfParsing.Parser,
	polygons  = [], circles = [], texts = [],
	allLayers = [], layersByEntities = [], mapping = [],
	parameters = {}, dimensions = {};


dxf.toArray("path/to/dxf", function(sectionTab) {

       //Extract polygons and texts and do a mapping
       polygons = dxf.getPolygons(sectionTab);
       texts = dxf.getTexts(sectionTab);
       mapping = dxf.makeMappings(polygons, texts);



       //You can also extract the circles
       circles = dxf.getCircles(sectionTab);

       //Extract layers
       allLayers = dxf.getAllLayers(sectionTab);

       layersByEntities = dxf.getLayersByEntities(sectionTab, ["text", "polygon", "circle"]);

       //extract parameters and dimension
       parameters = dxf.getParameters(sectionTab);
       dimensions = dxf.getDimensions(polygons);

    }
```
    	   
    	   
    	   

