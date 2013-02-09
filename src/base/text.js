/*
    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    
    You can redistribute it and/or modify it under the terms of the
    
      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
    
    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.
    
    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true*/
/*jslint nomen: true, plusplus: true*/

/* depends:
 JXG
 base/constants
 base/coords
 base/element
 parser/geonext
 math/statistics
 utils/env
 utils/type
 utils/object
 */

/**
 * @fileoverview In this file the Text element is defined.
 */

(function () {

    "use strict";

    /**
     * Construct and handle texts.
     * @class Text: On creation the GEONExT syntax
     * of <value>-terms
     * are converted into JavaScript syntax.
     * The coordinates can be relative to the coordinates of an element "element".
     * @constructor
     * @return A new geometry element Text
     */
    JXG.Text = function (board, content, coords, attributes) {
        this.constructor(board, attributes, JXG.OBJECT_TYPE_TEXT, JXG.OBJECT_CLASS_OTHER);

        var i, anchor;

        this.content = '';
        this.plaintext = '';

        this.isDraggable = false;
        this.needsSizeUpdate = false;
        this.element = JXG.getRef(this.board, attributes.anchor);

        if (this.element) {
            if (this.visProp.islabel) {
                this.relativeCoords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [parseFloat(coords[0]), parseFloat(coords[1])], this.board);
            } else {
                this.relativeCoords = new JXG.Coords(JXG.COORDS_BY_USER, [parseFloat(coords[0]), parseFloat(coords[1])], this.board);
            }
            this.element.addChild(this);

            this.X = function () {
                var sx, coords, anchor;

                if (this.visProp.islabel) {
                    sx =  parseFloat(this.visProp.offset[0]);
                    anchor = this.element.getLabelAnchor();
                    coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [sx + this.relativeCoords.scrCoords[1] + anchor.scrCoords[1], 0], this.board);

                    return coords.usrCoords[1];
                }

                anchor = this.element.getTextAnchor();
                return this.relativeCoords.usrCoords[1] + anchor.usrCoords[1];
            };

            this.Y = function () {
                var sy, coords, anchor;

                if (this.visProp.islabel) {
                    sy = -parseFloat(this.visProp.offset[1]);
                    anchor = this.element.getLabelAnchor();
                    coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, sy + this.relativeCoords.scrCoords[2] + anchor.scrCoords[2]], this.board);

                    return coords.usrCoords[2];
                }

                anchor = this.element.getTextAnchor();
                return this.relativeCoords.usrCoords[2] + anchor.usrCoords[2];
            };

            this.coords = new JXG.Coords(JXG.COORDS_BY_SCREEN, [0, 0], this.board);
            this.isDraggable = true;
        } else {
            if (JXG.isNumber(coords[0]) && JXG.isNumber(coords[1])) {
                this.isDraggable = true;
            }
            this.X = JXG.createFunction(coords[0], this.board, null, true);
            this.Y = JXG.createFunction(coords[1], this.board, null, true);

            this.coords = new JXG.Coords(JXG.COORDS_BY_USER, [this.X(), this.Y()], this.board);
        }

        this.Z = JXG.createFunction(1, this.board, '');
        this.size = [1.0, 1.0];
        this.id = this.board.setId(this, 'T');
        this.board.renderer.drawText(this);

        this.setText(content);
        this.updateSize();

        if (!this.visProp.visible) {
            this.board.renderer.hide(this);
        }

        if (typeof this.content === 'string') {
            this.notifyParents(this.content);
        }

        this.elType = 'text';

        this.methodMap = JXG.deepCopy(this.methodMap, {
            setText: 'setTextJessieCode',
            free: 'free',
            move: 'setCoords'
        });

        return this;
    };

    JXG.Text.prototype = new JXG.GeometryElement();

    JXG.extend(JXG.Text.prototype, /** @lends JXG.Text.prototype */ {
        /**
         * @private
         * Test if the the screen coordinates (x,y) are in a small stripe
         * at the left side or at the right side of the text.
         * Sensitivity is set in this.board.options.precision.hasPoint.
         * @param {Number} x
         * @param {Number} y
         * @return {Boolean}
         */
        hasPoint: function (x, y) {
            var lft, rt, top, bot,
                r = this.board.options.precision.hasPoint;

            if (this.visProp.anchorx === 'right') {
                lft = this.coords.scrCoords[1] - this.size[0];
            } else if (this.visProp.anchorx === 'middle') {
                lft = this.coords.scrCoords[1] - 0.5 * this.size[0];
            } else {
                lft = this.coords.scrCoords[1];
            }
            rt = lft + this.size[0];

            if (this.visProp.anchory === 'top') {
                bot = this.coords.scrCoords[2] + this.size[1];
            } else if (this.visProp.anchorx === 'middle') {
                bot = this.coords.scrCoords[2] + 0.5 * this.size[1];
            } else {
                bot = this.coords.scrCoords[2];
            }
            top = bot - this.size[1];

            return (y >= top - r && y <= bot + r) &&
                    ((x >= lft - r  && x <= lft + 2 * r) ||
                    (x >= rt - 2 * r && x <= rt + r));
        },

        /**
         * Defines new content. This is used by {@link JXG.Text#setTextJessieCode} and {@link JXG.Text#setText}. This is required because
         * JessieCode needs to filter all Texts inserted into the DOM and thus has to replace setText by setTextJessieCode.
         * @param {String|Function|Number} text
         * @return {JXG.Text}
         * @private
         */
        _setText: function (text) {
            this.needsSizeUpdate = false;

            if (typeof text === 'function') {
                this.updateText = function () {
                    this.plaintext = text();
                };
                this.needsSizeUpdate = true;
            } else {
                if (JXG.isNumber(text)) {
                    this.content = (text).toFixed(this.visProp.digits);
                } else {
                    if (this.visProp.useasciimathml) {
                        // Convert via ASCIIMathML
                        this.content = "'`" + text + "`'";
                        this.needsSizeUpdate = true;
                    } else {
                        // Converts GEONExT syntax into JavaScript string
                        this.content = this.generateTerm(text);
                    }
                }
                this.updateText = new Function('this.plaintext = ' + this.content + '; ');
            }

            // First evaluation of the string.
            // We need this for display='internal' and Canvas
            this.updateText();

            this.prepareUpdate().update().updateRenderer();

            return this;
        },

        /**
         * Defines new content but converts &lt; and &gt; to HTML entities before updating the DOM.
         * @param {String|function} text
         */
        setTextJessieCode: function (text) {
            var s;

            this.visProp.castext = text;

            if (typeof text === 'function') {
                s = function () {
                    return text().replace(/</g, '&lt;').replace(/>/g, '&gt;');
                };
            } else {
                if (JXG.isNumber(text)) {
                    s = text;
                } else {
                    s = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
            }

            return this._setText(s);
        },

        /**
         * Defines new content.
         * @param {String|function} text
         * @return {JXG.Text} Reference to the text object.
         */
        setText: function (text) {
            return this._setText(text);
        },

        /**
         * Recompute the width and the height of the text box.
         * Update array this.size with pixel values.
         * The result may differ from browser to browser
         * by some pixels.
         * In IE and canvas we use a very crude estimation of the dimensions of
         * the textbox.
         * In JSXGraph this.size is necessary for applying rotations in IE and
         * for aligning text.
         */
        updateSize: function () {
            var tmp;

            if (!JXG.isBrowser) {
                return this;
            }

            if (this.visProp.display === 'html' && this.board.renderer.type !== 'vml' && this.board.renderer.type !== 'no') {
                this.size = [this.rendNode.offsetWidth, this.rendNode.offsetHeight];
            } else if (this.visProp.display === 'internal' && this.board.renderer.type === 'svg') {
                try {
                    // getBBox broken in FF 13? No.
                    tmp = this.rendNode.getBBox();
                    this.size = [tmp.width, tmp.height];
                } catch (e) {
                }
            } else if (this.board.renderer.type === 'vml' || (this.visProp.display === 'internal' && this.board.renderer.type === 'canvas')) {
                // Here comes a very crude estimation of the dimensions of the textbox.
                this.size = [parseFloat(this.visProp.fontsize) * this.plaintext.length * 0.45, parseFloat(this.visProp.fontsize) * 0.9];
            }

            return this;
        },

        /**
         * Return the width of the text element.
         * @return {Array} [width, height] in pixel
         */
        getSize: function () {
            return this.size;
        },

        /**
         * Move the text to new coordinates.
         * @param {number} x
         * @param {number} y
         * @return {object} reference to the text object.
         */
        setCoords: function (x, y) {
            if (JXG.isArray(x) && x.length > 1) {
                y = x[1];
                x = x[0];
            }

            this.X = function () {
                return x;
            };

            this.Y = function () {
                return y;
            };

            this.coords.setCoordinates(JXG.COORDS_BY_USER, [x, y]);

            // this should be a local update, otherwise there might be problems
            // with the tick update routine resulting in orphaned tick labels
            this.prepareUpdate().update().updateRenderer();

            return this;
        },

        free: function () {
            this.X = JXG.createFunction(this.X(), this.board, '');
            this.Y = JXG.createFunction(this.Y(), this.board, '');

            this.isDraggable = true;
        },

        /**
         * Evaluates the text.
         * Then, the update function of the renderer
         * is called.
         */
        update: function () {
            var anchor, sx, sy;

            if (this.needsUpdate) {
                if (!this.visProp.frozen) {
                    this.updateCoords();
                }
                this.updateText();

                if (this.needsSizeUpdate) {
                    this.updateSize();
                }
                this.updateTransform();
            }

            return this;
        },

        /**
         * Updates the coordinates of the text element.
         */
        updateCoords: function () {
            this.coords.setCoordinates(JXG.COORDS_BY_USER, [this.X(), this.Y()]);
        },

        /**
         * The update function of the renderert
         * is called.
         * @private
         */
        updateRenderer: function () {
            if (this.needsUpdate) {
                this.board.renderer.updateText(this);
                this.needsUpdate = false;
            }
            return this;
        },

        updateTransform: function () {
            var i;

            if (this.transformations.length === 0) {
                return this;
            }

            for (i = 0; i < this.transformations.length; i++) {
                this.transformations[i].update();
            }

            return this;
        },

        /**
         * Converts the GEONExT syntax of the <value> terms into JavaScript.
         * Also, all Objects whose name appears in the term are searched and
         * the text is added as child to these objects.
         * @private
         * @see JXG.GeonextParser.geonext2JS.
         */
        generateTerm: function (contentStr) {
            var res, term, i, j,
                plaintext = '""';

            contentStr = contentStr || '';
            contentStr = contentStr.replace(/\r/g, '');
            contentStr = contentStr.replace(/\n/g, '');
            contentStr = contentStr.replace(/\"/g, '\\"');
            contentStr = contentStr.replace(/\'/g, "\\'");
            contentStr = contentStr.replace(/&amp;arc;/g, '&ang;');
            contentStr = contentStr.replace(/<arc\s*\/>/g, '&ang;');
            contentStr = contentStr.replace(/<sqrt\s*\/>/g, '&radic;');

            // Convert GEONExT syntax into  JavaScript syntax
            i = contentStr.indexOf('<value>');
            j = contentStr.indexOf('</value>');
            if (i >= 0) {
                this.needsSizeUpdate = true;
                while (i >= 0) {
                    plaintext += ' + "' + JXG.GeonextParser.replaceSub(JXG.GeonextParser.replaceSup(contentStr.slice(0, i))) + '"';
                    term = contentStr.slice(i + 7, j);
                    res = JXG.GeonextParser.geonext2JS(term, this.board);
                    res = res.replace(/\\"/g, '"');
                    res = res.replace(/\\'/g, "'");

                    // GEONExT-Hack: apply rounding once only.
                    if (res.indexOf('toFixed') < 0) {
                        // output of a value tag
                        if (JXG.isNumber((JXG.bind(new Function('return ' + res + ';'), this))())) {
                            // may also be a string
                            plaintext += '+(' + res + ').toFixed(' + (this.visProp.digits) + ')';
                        } else {
                            plaintext += '+(' + res + ')';
                        }
                    } else {
                        plaintext += '+(' + res + ')';
                    }

                    contentStr = contentStr.slice(j + 8);
                    i = contentStr.indexOf('<value>');
                    j = contentStr.indexOf('</value>');
                }
            }

            plaintext += ' + "' + JXG.GeonextParser.replaceSub(JXG.GeonextParser.replaceSup(contentStr)) + '"';
            plaintext = plaintext.replace(/<overline>/g, '<span style=text-decoration:overline>');
            plaintext = plaintext.replace(/<\/overline>/g, '</span>');
            plaintext = plaintext.replace(/<arrow>/g, '<span style=text-decoration:overline>');
            plaintext = plaintext.replace(/<\/arrow>/g, '</span>');

            // This should replace &amp;pi; by &pi;
            plaintext = plaintext.replace(/&amp;/g, '&');

            return plaintext;
        },

        /**
         * Finds dependencies in a given term and notifies the parents by adding the
         * dependent object to the found objects child elements.
         * @param {String} content String containing dependencies for the given object.
         * @private
         */
        notifyParents: function (content) {
            var search,
                res = null;

            do {
                search = /<value>([\w\s\*\/\^\-\+\(\)\[\],<>=!]+)<\/value>/;
                res = search.exec(content);

                if (res !== null) {
                    JXG.GeonextParser.findDependencies(this, res[1], this.board);
                    content = content.substr(res.index);
                    content = content.replace(search, '');
                }
            } while (res !== null);

            return this;
        },

        bounds: function () {
            var c = this.coords.usrCoords;

            return this.visProp.islabel ? [0, 0, 0, 0] : [c[1], c[2] + this.size[1], c[1] + this.size[0], c[2]];
        },

        /**
         * Sets x and y coordinate of the text.
         * @param {Number} method The type of coordinates used here. Possible values are {@link JXG.COORDS_BY_USER} and {@link JXG.COORDS_BY_SCREEN}.
         * @param {Array} coords coordinates in screen/user units
         * @param {Array} oldcoords previous coordinates in screen/user units
         * @returns {JXG.Text} this element
         */
        setPositionDirectly: function (method, coords, oldcoords) {
            var dc, v,
                c = new JXG.Coords(method, coords, this.board),
                oldc = new JXG.Coords(method, oldcoords, this.board);

            if (this.relativeCoords) {
                if (this.visProp.islabel) {
                    dc = JXG.Math.Statistics.subtract(c.scrCoords, oldc.scrCoords);
                    this.relativeCoords.scrCoords[1] += dc[1];
                    this.relativeCoords.scrCoords[2] += dc[2];
                } else {
                    dc = JXG.Math.Statistics.subtract(c.usrCoords, oldc.usrCoords);
                    this.relativeCoords.usrCoords[1] += dc[1];
                    this.relativeCoords.usrCoords[2] += dc[2];
                }
            } else {
                dc = JXG.Math.Statistics.subtract(c.usrCoords, oldc.usrCoords);
                v = [this.Z(), this.X(), this.Y()];
                this.X = JXG.createFunction(v[1] + dc[1], this.board, '');
                this.Y = JXG.createFunction(v[2] + dc[2], this.board, '');
            }

            return this;
        }

    });

    /**
     * @class This element is used to provide a constructor for text, which is just a wrapper for element {@link Text}.
     * @pseudo
     * @description
     * @name Text
     * @augments JXG.GeometryElement
     * @constructor
     * @type JXG.Text
     *
     * @param {number,function_number,function_String,function} x,y,str Parent elements for text elements.
     *                     <p>
     *                     x and y are the coordinates of the lower left corner of the text box. The position of the text is fixed,
     *                     x and y are numbers. The position is variable if x or y are functions.
     *                     <p>
     *                     The text to display may be given as string or as function returning a string.
     *
     * There is the attribute 'display' which takes the values 'html' or 'internal'. In case of 'html' a HTML division tag is created to display
     * the text. In this case it is also possible to use ASCIIMathML. Incase of 'internal', a SVG or VML text element is used to display the text.
     * @see JXG.Text
     * @example
     * // Create a fixed text at position [0,1].
     *   var t1 = board.create('text',[0,1,"Hello World"]);
     * </pre><div id="896013aa-f24e-4e83-ad50-7bc7df23f6b7" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var t1_board = JXG.JSXGraph.initBoard('896013aa-f24e-4e83-ad50-7bc7df23f6b7', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
     *   var t1 = t1_board.create('text',[0,1,"Hello World"]);
     * </script><pre>
     * @example
     * // Create a variable text at a variable position.
     *   var s = board.create('slider',[[0,4],[3,4],[-2,0,2]]);
     *   var graph = board.create('text',
     *                        [function(x){ return s.Value();}, 1,
     *                         function(){return "The value of s is"+s.Value().toFixed(2);}
     *                        ]
     *                     );
     * </pre><div id="5441da79-a48d-48e8-9e53-75594c384a1c" style="width: 300px; height: 300px;"></div>
     * <script type="text/javascript">
     *   var t2_board = JXG.JSXGraph.initBoard('5441da79-a48d-48e8-9e53-75594c384a1c', {boundingbox: [-3, 6, 5, -3], axis: true, showcopyright: false, shownavigation: false});
     *   var s = t2_board.create('slider',[[0,4],[3,4],[-2,0,2]]);
     *   var t2 = t2_board.create('text',[function(x){ return s.Value();}, 1, function(){return "The value of s is "+s.Value().toFixed(2);}]);
     * </script><pre>
     */
    JXG.createText = function (board, parents, attributes) {
        var t,
            attr = JXG.copyAttributes(attributes, board.options, 'text');

        // downwards compatibility
        attr.anchor = attr.parent || attr.anchor;

        t = new JXG.Text(board, parents[parents.length - 1], parents, attr);

        if (typeof parents[parents.length - 1] !== 'function') {
            t.parents = parents;
        }

        if (JXG.evaluate(attr.rotate) !== 0 && attr.display === 'internal') {
            t.addRotation(JXG.evaluate(attr.rotate));
        }

        return t;
    };

    JXG.JSXGraph.registerElement('text', JXG.createText);
}());