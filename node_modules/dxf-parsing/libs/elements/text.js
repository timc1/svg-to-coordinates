/**
 * Text's constructor
 * @constructor
 */
function Text (layer, contents, point) {
    this.layer    = layer || 'defaultLayer';
    this.contents = contents || 'defaultContents';
    this.point    = point || undefined;
}

/**
 * Set the layer
 * @param {String} layer
 */
Text.prototype.setLayer = function setLayer(layer) {
    this.layer = layer;
};

/**
 * Set the contents
 * @param {String}  contents
 */
Text.prototype.setContents = function setContents(contents) {
    this.contents = contents;
};

/**
 * Set the point
 * @param {Point}   point
 */
Text.prototype.setPoint = function setPoint(point) {
    this.point = point;
};

/**
 * This prototype is made to parse the contents of Text
 */
Text.prototype.contentsParse = function parse(){

    if(/^\{.{1,}\}$/.test(this.contents)){
        this.contents = this.contents.slice(1,-1);
        this.contents = this.contents.trim();
        if(/;$/.test(this.contents)) this.contents = this.contents.slice(0,-1);
        this.contents = this.contents.split('|');
        this.contents = this.contents[this.contents.length-1].split(';');
        this.contents = this.contents[this.contents.length-1].trim();
    }
    if(/^\\/.test(this.contents)) {
        this.contents = this.contents.trim();
        this.contents = this.contents.split(';');
        this.contents = this.contents[this.contents.length-1].trim();
    }
    this.contents = this.contents.replace(/\\[A-Z][0-9]{0,}/g,' ');
    this.contents = this.contents.replace(/\^[A-Z]/g,' ');
    this.contents = this.contents.replace(/ {1,}/g,' ');
    this.contents = this.contents.trim();
};

module.exports = Text;