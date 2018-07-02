
Nskd = window.Nskd || {};

Nskd.Dom = {};

Nskd.Dom.create = function (tagName, attrs, stiles) {
    var node = {};
    if (Nskd.Js.is(tagName, 'string')) {
        if (tagName === '#text') {
            node = document.createTextNode(String(attrs));
        } else {
            node = document.createElement(tagName);
            if (Nskd.Js.is(attrs, 'object')) {
                for (var key in attrs) if (attrs.hasOwnProperty(key)) {
                    node.setAttribute(key, String(attrs[key]));
                }
            }
            if (Nskd.Js.is(stiles, 'object')) {
                for (key in stiles) if (stiles.hasOwnProperty(key)) {
                    node.style[key] = String(stiles[key]);
                }
            }
        }
    }
    return node;
};

Nskd.Dom.empty = function empty(node) {
    if (node) {
        while (node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }
    }
    return node;
};
