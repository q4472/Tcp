Nskd = window.Nskd || {};

Nskd.Js = (function () {
    var lut = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
    return {
        is: function (o, t) {
            return ((t == 'undefined') && (o === undefined))
                    || ((t == 'null') && (o === null))
                    || ((t == 'boolean') && ((typeof o == 'boolean') || (o instanceof Boolean)))
                    || ((t == 'string') && ((typeof o == 'string') || (o instanceof String)))
                    || ((t == 'number') && ((typeof o == 'number') || (o instanceof Number)))
                    || ((t == 'function') && (typeof o == 'function'))
                    || ((t == 'object') && (typeof o == 'object') && (o instanceof Object))
                    || ((t == 'array') && (typeof o == 'object') && (o instanceof Array))
                    || ((t == 'date') && (typeof o == 'object') && (o instanceof Date));
        },
        guid: function () {
            var d0 = Math.random() * 0xffffffff | 0;
            var d1 = Math.random() * 0xffffffff | 0;
            var d2 = Math.random() * 0xffffffff | 0;
            var d3 = Math.random() * 0xffffffff | 0;
            return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
              lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
              lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
              lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
        }
    }
})();

