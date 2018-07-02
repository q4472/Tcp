
Nskd = window.Nskd || {};

Nskd.Client = {};

Nskd.Client.EnvVars = {};

Nskd.Client.EnvVars.selectedMenuNodePath = null;

﻿Nskd = window.Nskd || {};

Nskd.Convert = (function () {
    var my = {};

    my.byteArrayToHexString = function (b) {
        var s = '';
        for (var i = 0; i < b.length; i++) {
            var t = b[i].toString(16);
            s += (t.length < 2) ? '0' + t : t;
        }
        return s;
    };

    my.hexStringToByteArray = function (s) {
        var b = [];
        if ((s.length % 2) == 1) s += "0";
        for (var i = 0; i < s.length; i += 2) {
            b[i / 2] = parseInt(s.substring(i, i + 2), 16);
        }
        return b;
    };

    my.byteArrayToBase64String = function (a) {
        var s = '';
        var len = a.length / 3;
        for (var i = 0; i < len; i++) {
            var i3 = i * 3;
            var n0 = (i3 < a.length) ? a[i3++] : 0;
            var n1 = (i3 < a.length) ? a[i3++] : 0;
            var n2 = (i3 < a.length) ? a[i3] : 0;
            s += String.fromCharCode(ntob64cc(n0 >> 2));
            s += String.fromCharCode(ntob64cc(((n0 & 3) << 4) | (n1 >> 4)));
            s += String.fromCharCode(ntob64cc(((n1 & 15) << 2) | (n2 >> 6)));
            s += String.fromCharCode(ntob64cc(n2 & 63));
        }
        var tail = a.length % 3;
        if (tail == 1) {
            s = s.substring(0, s.length - 2) + '==';
        } else if (tail == 2) {
            s = s.substring(0, s.length - 1) + '=';
        }
        return s;

        function ntob64cc(n) {
            return (n >= 0 && n < 26) ? n + 65
            : (n < 52) ? n + 71
            : (n < 62) ? n - 4
            : (n === 62) ? 43
            : (n === 63) ? 47
            : 61;
        }
    };

    my.base64StringToByteArray = function (s) {
        var a = [];
        var len = s.length / 4;
        for (var i = 0; i < len; i++) {
            var i4 = i * 4;
            var c0 = b64ccton(s.charCodeAt(i4++));
            var c1 = b64ccton(s.charCodeAt(i4++));
            var c2 = b64ccton(s.charCodeAt(i4++));
            var c3 = b64ccton(s.charCodeAt(i4));
            a.push(((c0 << 2) | (c1 >> 4)) & 255);
            if (c2 >= 0) {
                a.push(((c1 << 4) | (c2 >> 2)) & 255);
                if (c3 >= 0) {
                    a.push(((c2 << 6) | (c3 >> 0)) & 255);
                }
            }
        }
        return a;

        function b64ccton(b64cc) {
            return ((b64cc > 64 && b64cc < 91) ? b64cc - 65
            : (b64cc > 96 && b64cc < 123) ? b64cc - 71
            : (b64cc > 47 && b64cc < 58) ? b64cc + 4
            : (b64cc === 43) ? 62
            : (b64cc === 47) ? 63
            : -1);
        };
    };

    my.byteArrayToBigInteger = function (bytes) {
        var rBytes = [];
        i = bytes.length;
        while (--i >= 0) rBytes.push(bytes[i]);
        return new BigInteger(rBytes, 256);
    };

    my.bigIntegerToByteArray = function (n) {
        // встроенная функция от BigInteger. За ней надо исправлять порядок и знаки у байтов.
        var bytes = n.toByteArray();
        var rBytes = [];
        var i = bytes.length;
        while (--i >= 0) rBytes.push(bytes[i] & 0xff);
        return rBytes;
    };

    // Convert javascript string to number array with Unicode values
    my.stringToUnicodeArray = function (s) {
        var u = [];
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c < 0xd800) {
                u.push(c);
            } else if (c < 0xdc00) {
                if (++i < s.length) {
                    var d = s.charCodeAt(i);
                    if ((d & 0xfc00) == 0xdc00) {
                        u.push((((c & 0x03ff) << 10) | (d & 0x03ff)) + 0x10000);
                    }
                } else break;
            } else if (c < 0xe000) {
            } else {
                u.push(c);
            }
        }
        return u;
    };

    // Convert javascript string to number array with UTF8 values
    my.stringToUtf8Array = function (s, insertBOM) {
        var b = [];
        if (insertBOM) {
            b.push(0xef);
            b.push(0xbb);
            b.push(0xbf);
        }
        var u = Nskd.Convert.stringToUnicodeArray(s);
        for (var i = 0; i < u.length; i++) {
            var c = u[i];
            if (c < 0x80) {
                b.push(c);
            } else if (c < 0x800) {
                b.push(((c >> 06) & 0x1f) | 0xc0);
                b.push(((c >> 00) & 0x3f) | 0x80);
            } else if (c < 0x10000) {
                b.push(((c >> 12) & 0x0f) | 0xe0);
                b.push(((c >> 06) & 0x3f) | 0x80);
                b.push(((c >> 00) & 0x3f) | 0x80);
            } else {
                b.push(((c >> 18) & 0x07) | 0xf0);
                b.push(((c >> 12) & 0x3f) | 0x80);
                b.push(((c >> 06) & 0x3f) | 0x80);
                b.push(((c >> 00) & 0x3f) | 0x80);
            }
        }
        return b;
    };

    my.utf8ArrayToString = function (array) {
        var out, i, len, c;
        var char2, char3;

        out = "";
        len = array.length;
        i = 0;
        while (i < len) {
            c = array[i++];
            switch (c >> 4) {
                case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                    // 0xxxxxxx
                    out += String.fromCharCode(c);
                    break;
                case 12: case 13:
                    // 110x xxxx   10xx xxxx
                    char2 = array[i++];
                    out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                    break;
                case 14:
                    // 1110 xxxx  10xx xxxx  10xx xxxx
                    char2 = array[i++];
                    char3 = array[i++];
                    out += String.fromCharCode(((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0));
                    break;
            }
        }
        return out;
    };

    return my;
})();

﻿Nskd = window.Nskd || {};

Nskd.Crypt = {
    aes: function (key) {
        var _key = key;
        this.getKey = function () { return _key; };
        this.encrypt = function (data) { return Nskd.Crypt.aescbc.encrypt(data, _key) };
        this.decrypt = function (data) { return Nskd.Crypt.aescbc.decrypt(data, _key) };
    }
};

// использует aes из Cryptico-master
Nskd.Crypt.aescbc = (function () {

    aes.Init();

    var my = {};

    // Returns a XOR b, where a and b are 16-byte byte arrays.
    var blockXOR = function (a, b) {
        var xor = new Array(16);
        for (var i = 0; i < 16; i++) {
            xor[i] = a[i] ^ b[i];
        }
        return xor;
    }

    // Returns a 16-byte initialization vector.
    var blockIV = function () {
        var r = new SecureRandom();
        var IV = new Array(16);
        r.nextBytes(IV);
        return IV;
    }

    // Returns a copy of bytes with zeros appended to the end
    // so that the (length of bytes) % 16 == 0.
    var pad16 = function (bytes) {
        var newBytes = bytes.slice(0);
        var padding = (16 - (bytes.length % 16)) % 16;
        for (i = bytes.length; i < bytes.length + padding; i++) {
            newBytes.push(0);
        }
        return newBytes;
    }

    // Removes trailing zeros from a byte array.
    var depad = function (bytes) {
        var newBytes = bytes.slice(0);
        while (newBytes[newBytes.length - 1] == 0) {
            newBytes = newBytes.slice(0, newBytes.length - 1);
        }
        return newBytes;
    }

    my.encrypt = function (plainBlocks, key) {
        var exkey = key.slice(0);
        aes.ExpandKey(exkey);
        blocks = pad16(plainBlocks);
        var encryptedBlocks = blockIV();
        for (var i = 0; i < plainBlocks.length / 16; i++) {
            var tempBlock = plainBlocks.slice(i * 16, i * 16 + 16);
            var prevBlock = encryptedBlocks.slice((i) * 16, (i) * 16 + 16);
            tempBlock = blockXOR(prevBlock, tempBlock);
            aes.Encrypt(tempBlock, exkey);
            encryptedBlocks = encryptedBlocks.concat(tempBlock);
        }
        return encryptedBlocks;
    }

    my.decrypt = function (encryptedBlocks, key) {
        var exkey = key.slice(0);
        aes.ExpandKey(exkey);
        var decryptedBlocks = new Array();
        for (var i = 1; i < encryptedBlocks.length / 16; i++) {
            var tempBlock = encryptedBlocks.slice(i * 16, i * 16 + 16);
            var prevBlock = encryptedBlocks.slice((i - 1) * 16, (i - 1) * 16 + 16);
            aes.Decrypt(tempBlock, exkey);
            tempBlock = blockXOR(prevBlock, tempBlock);
            decryptedBlocks = decryptedBlocks.concat(tempBlock);
        }
        decryptedBlocks = depad(decryptedBlocks);
        return decryptedBlocks;
    }

    return my;
} ());

﻿
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
﻿
Nskd = window.Nskd || {};

Nskd.Expl = (function () {

    var p = (function () {
        return {
            'body': null,
            'create': null,
            'open': null,
            'move': null,
            'delete': null,
            'download': null,
            'file_upload_form': null,
            'form_cmd': null,
            'form_path': null,
            'form_sid': null,
            'form_smnp': null,
            'file': null,
            'file_text': null,
            'file_button': null,
            'upload': null,
            'info': null,
            'cont': null
        };
    })();

    function disable(node) {
        if (node) {
            node.setAttribute('disabled', 'disabled');
        }
    }
    function enable(node) {
        if (node) {
            node.removeAttribute('disabled');
        }
    }

    return {

        'init': function () {
            p.body = document.body;
            p.create = document.getElementById('p_create');
            p.open = document.getElementById('p_open');
            p.move = document.getElementById('p_move');
            p._delete_ = document.getElementById('p_delete');
            p.download = document.getElementById('p_download');
            p.file_upload_form = document.getElementById('p_file_upload_form');
            p.form_cmd = document.getElementById('p_form_cmd');
            p.form_path = document.getElementById('p_form_path');
            p.form_sid = document.getElementById('p_form_sid');
            p.form_smnp = document.getElementById('p_form_smnp');
            p.file = document.getElementById('p_file');
            p.file_text = document.getElementById('p_file_text');
            p.file_button = document.getElementById('p_file_button');
            p.upload = document.getElementById('p_file_up');
            p.info = document.getElementById('p_info');
            p.cont = document.getElementById('p_cont');

            Nskd.Expl.Cmd.init();
            Nskd.Expl.Env.path = '/';
            Nskd.Expl.Env.name = '';
            Nskd.Expl.Env.type = '';
            Nskd.Expl.Folder.open();

            p.body.onclick = function (event) {
                var target = event.target;
                if (target.nodeName == 'DIV') {
                    var td = target.parentNode;
                    if (td.nodeName == 'TD') {
                        var tr = td.parentNode;
                        if ((tr.nodeName == 'TR') && (tr.getAttribute('r'))) {
                            // всё очистить
                            Nskd.Dom.empty(p.info);
                            Nskd.Dom.empty(p.cont);
                            //Nskd.Dom.empty(p.msg);
                            // выделить выбранное цветом
                            var trs = tr.parentNode.getElementsByTagName('TR');
                            for (var i = 0; i < trs.length; i++) trs[i].className = '';
                            tr.className = 'sr';
                            // взять id
                            var cell = tr.getElementsByTagName('TD')[0];
                            var div = cell.firstChild;
                            var text = div.firstChild;
                            //alert(text);
                            Nskd.Expl.Env.id = text.nodeValue;
                            // взять имя
                            cell = tr.getElementsByTagName('TD')[1];
                            div = cell.firstChild;
                            var guid = div.getAttribute('guid');
                            //alert(div.getAttribute('guid'));
                            text = div.firstChild;
                            Nskd.Expl.Env.name = text.nodeValue;
                            if (guid) Nskd.Expl.Env.name += '.' + div.getAttribute('guid');
                            // взять тип
                            cell = tr.getElementsByTagName('TD')[3];
                            div = cell.firstChild;
                            text = div.firstChild;
                            Nskd.Expl.Env.type = text.nodeValue;
                            // активировать кнопки
                            Nskd.Expl.Cmd.onSelectDirectoryRow();
                        }
                    }
                }
            };

            p.body.ondblclick = function (event) {
                var target = event.target;
                if (target.nodeName == 'DIV') {
                    var td = target.parentNode;
                    if (td.nodeName == 'TD') {
                        var tr = td.parentNode;
                        if ((tr.nodeName == 'TR') && (tr.getAttribute('r'))) {
                            p.open.onclick();
                        }
                    }
                }
                if (event.preventDefault) event.preventDefault();
                else event.returnValue = false;
                return false;
            };

            p.create.onclick = function () {
                disable(p.create);
                var name = prompt('Enter a name for the new folder.', 'New folder');
                if (name) {
                    name = name.replace(/^\s+|\s+$/g, ''); // trim
                    if (name) {
                        Nskd.Expl.Env.name = name;
                        Nskd.Expl.Folder.create();
                        Nskd.Expl.Env.name = '';
                    }
                }
            };

            p.open.onclick = function () {
                disable(p.open);
                if (Nskd.Expl.Env.type == 'Folder') {
                    Nskd.Expl.Env.path = Nskd.Expl.Path.combine(Nskd.Expl.Env.path, Nskd.Expl.Env.name);
                    Nskd.Expl.Env.name = '';
                    Nskd.Expl.Env.type = '';
                    Nskd.Expl.Folder.open();
                } else {
                    Nskd.Expl.File.open();
                    Nskd.Expl.Cmd.onFileOpen();
                }
            };

            p.move.onclick = function () {
                disable(p.move);
                if (p.move.value == 'move') {
                    Nskd.Expl.Env.source.path = Nskd.Expl.Env.path;
                    Nskd.Expl.Env.source.name = Nskd.Expl.Env.name;
                    Nskd.Expl.Env.source.type = Nskd.Expl.Env.type;
                    p.move.value = 'paste';
                } else {
                    Nskd.Expl.File.move();
                    p.move.value = 'move';
                }
            };

            p._delete_.onclick = function () {
                disable(p._delete_);
                if (Nskd.Expl.Env.type == 'Folder') {
                    Nskd.Expl.Folder._delete_();
                } else {
                    Nskd.Expl.File._delete_();
                }
            };

            p.download.onclick = function () {
                disable(p.download);
                if (Nskd.Expl.Env.type == 'File') {
                    Nskd.Expl.File.download();
                }
            };

            p.upload.onclick = function () {
                disable(p.upload);
                Nskd.Expl.Env.name = '';
                Nskd.Expl.Env.type = '';
                p.file_text.value = '';
                p.form_cmd.value = 'upload';
                p.form_path.value = Nskd.Expl.Env.path;
                p.form_sid.value = Nskd.Server.SessionId;
                p.form_smnp.value = Nskd.Client.EnvVars.selectedMenuNodePath;
                p.file_upload_form.submit(); // Send post request and load response into the iframe. Then refresh.
            };

            p.file.onchange = function () {
                var ffnps = p.file.value.split('\\');
                p.file_text.value = (ffnps[ffnps.length - 1]);
                enable(p.upload);
            };

        },

        'Env': (function () {
            return {
                'id': '',
                'path': '/',
                'name': '',
                'type': '',
                'source': {
                    'id': '',
                    'path': '/',
                    'name': '',
                    'type': ''
                },
                'dest': {
                    'id': '',
                    'path': '/',
                    'name': '',
                    'type': ''
                }
            };
        })(),

        'Folder': (function () {
            return {
                'create': function () {
                    var pars = {
                        'cmd': 'CreateDirectory',
                        'path': Nskd.Expl.Env.path,
                        'name': Nskd.Expl.Env.name
                    };
                    Nskd.Server.execute(pars, Nskd.Expl.Folder.show);
                },
                'open': function () {
                    var pars = {
                        'cmd': 'GetDirectoryInfo',
                        'path': Nskd.Expl.Env.path,
                        'name': Nskd.Expl.Env.name
                    };
                    Nskd.Server.execute(pars, Nskd.Expl.Folder.show);
                },
                'delete': function () {
                    var pars = {
                        'cmd': 'DeleteDirectory',
                        'path': Nskd.Expl.Env.path,
                        'name': Nskd.Expl.Env.name
                    };
                    Nskd.Server.execute(pars, Nskd.Expl.Folder.show);
                },
                'show': function (table) {
                    if ((table) && (table.hasOwnProperty('__type')) && (table.__type == 'Nskd.Data.DataTable')) {
                        var cols = table.columns;
                        var rows = table.rows;
                        var html =
                            createDirectoryPath() +
                            createDirecrotyHead() +
                            createDirectoryBody();
                        Nskd.Dom.empty(p.dir);
                        p_dir.innerHTML = html;
                        Nskd.Dom.empty(p.info);
                        Nskd.Dom.empty(p.cont);
                        //Nskd.Dom.empty(p.msg);
                        Nskd.Expl.Cmd.onShowDirectory();
                    }
                    return;

                    function createDirectoryPath() {
                        var html = '<table><tr><td><div>' + Nskd.Expl.Env.path + '</div></td></tr></table>';
                        return html;
                    }

                    function createDirecrotyHead() {
                        var html = '<table style="border-collapse: collapse;"><tr>';
                        for (var ci = 0; ci < cols.length; ci++) {
                            html += '<td class="bb"><div class="c' + ci + '">';
                            html += cols[ci].columnName;
                            html += '</div></td>';
                        }
                        html += '</tr></table>';
                        return html;
                    }

                    function createDirectoryBody() {
                        var html = '<table style="border-collapse: collapse;">';
                        for (var ri = 0; ri < rows.length; ri++) {
                            html += '<tr r="' + ri + '">';
                            for (var ci = 0; ci < cols.length; ci++) {
                                var data = String(rows[ri][ci]);
                                var guid = '';
                                if (ci == 1) {
                                    var a = data.split('.');
                                    var g = a.pop();
                                    if (g.length == 36) {
                                        guid = g;
                                        data = a.join('.');
                                    }
                                }
                                html += '<td class="bt"><div class="c' + ci + '" guid="' + guid + '">';
                                html += data;
                                html += '</div></td>';
                            }
                            html += '</tr>';
                        }
                        html += '</table>';
                        return html;
                    }
                }
            }
        })(),

        'File': (function () {
            return {
                'open': function () {
                    var pars = {
                        'cmd': 'GetFileInfo',
                        'path': Nskd.Expl.Env.path,
                        'name': Nskd.Expl.Env.name
                    };
                    Nskd.Server.execute(pars, Nskd.Expl.File.show);
                },
                'move': function () {
                    var pars = {
                        'cmd': 'Move',
                        'path': Nskd.Expl.Env.path,
                        'name': Nskd.Expl.Env.name,
                        'sPath': Nskd.Expl.Env.source.path,
                        'sName': Nskd.Expl.Env.source.name,
                        'sType': Nskd.Expl.Env.source.type
                    };
                    Nskd.Server.execute(pars, Nskd.Expl.Folder.show);
                },
                'delete': function () {
                    var pars = {
                        'cmd': 'DeleteFile',
                        'path': Nskd.Expl.Env.path,
                        'name': Nskd.Expl.Env.name
                    };
                    Nskd.Server.execute(pars, Nskd.Expl.Folder.show);
                },
                'download': function () {
                    Nskd.Server.downloadFile(Nskd.Expl.Env.id);
                },
                'show': function (result) {

                    Nskd.Dom.empty(p.info);
                    Nskd.Dom.empty(p.cont);

                    if (Nskd.Js.is(result, 'string')) {

                        p.cont.innerHTML = result;

                    } else {

                        var tables = result.tables;
                        var binContent = tables[0];
                        var packageProperties = tables[1];
                        var packageContent = tables[2];

                        var div = document.createElement('div');
                        {
                            div.style.backgroundColor = '#ffffee';
                            div.appendChild(Nskd.Dom.create('#text', '--- begin content as ascii -----'));
                            div.appendChild(document.createElement('br'));
                            for (var ri = 0; ri < binContent.rows.length; ri++) {
                                div.appendChild(Nskd.Dom.create('#text', binContent.rows[ri][0]));
                                div.appendChild(document.createElement('br'));
                            }
                            div.appendChild(Nskd.Dom.create('#text', '--- end ascii content ----------'));
                            div.appendChild(document.createElement('br'));

                            for (var i = 0; i < packageProperties.rows.length; i++) {
                                var propName = packageProperties.rows[i][0];
                                var propValue = packageProperties.rows[i][1];
                                div.appendChild(Nskd.Dom.create('#text', '' + propName + ': ' + propValue));
                                div.appendChild(document.createElement('br'));
                            }
                        }
                        p.info.appendChild(div);

                        if (packageContent && packageContent.rows.length > 0) {
                            var table = document.createElement('table');
                            for (var ri = 0; ri < packageContent.rows.length; ri++) {
                                var tr = document.createElement('tr');
                                for (var ci = 0; ci < packageContent.columns.length; ci++) {
                                    var td = document.createElement('td');
                                    td.appendChild(Nskd.Dom.create('#text', packageContent.rows[ri][ci]));
                                    tr.appendChild(td);
                                }
                                table.appendChild(tr);
                            }
                            p.cont.appendChild(table);
                        }
                    }
                }
            }
        })(),

        'Path': (function () {
            return {
                'combine': function (path, name) {
                    var p = path;
                    if (name == '..') {
                        var dirs = p.split('/');
                        p = '';
                        for (var i = 1; i < (dirs.length - 1) ; i++) {
                            p += '/' + dirs[i];
                        }
                        if (p == '') p = '/';
                    }
                    else {
                        if (p == '/') p += name;
                        else p += '/' + name;
                    }
                    return p;
                }
            }
        })(),

        'Cmd': (function () {
            return {
                init: function () {
                    disable(p.create);
                    disable(p.open);
                    disable(p.move);
                    disable(p._delete_);
                    disable(p.download);
                    disable(p.upload);
                },
                onShowDirectory: function () {
                    enable(p.create);
                    disable(p.open);
                    (p.move.value == 'move') ?
                        disable(p.move) :
                        enable(p.move);
                    disable(p._delete_);
                    disable(p.download);
                    disable(p.upload);
                },
                onSelectDirectoryRow: function () {
                    enable(p.create);
                    enable(p.open);
                    (Nskd.Expl.Env.name == '..') ?
                        disable(p.move) :
                        enable(p.move);
                    (Nskd.Expl.Env.name == '..') ?
                        disable(p._delete_) :
                        enable(p._delete_);
                    (Nskd.Expl.Env.type == 'Folder') ?
                        disable(p.download) :
                        enable(p.download);
                    disable(p.upload);
                },
                onFileOpen: function () {
                    enable(p.create);
                    disable(p.open);
                    (p.move.value != 'move') ?
                        disable(p.move) :
                        enable(p.move);
                    enable(p._delete_);
                    enable(p.download);
                    disable(p.upload);
                }
            };
        })()

    }
})();

﻿Nskd = window.Nskd || {};

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

﻿Nskd = window.Nskd || {};

Nskd.Json = {

    parse: function (s) {
        return window.eval('(' + s + ')');
    },

    toString: function (o) {
        return writeValue(o);

        function writeValue(v) {
            var s = '';
            if (v == null) s += 'null'; // null
            else {
                switch (typeof v) {
                    case 'object':
                        s += writeObject(v);
                        break;
                    case 'string':
                        s += writeString(v);
                        break;
                    case 'number':
                        s += v;
                        break;
                    case 'boolean':
                        s += (v) ? 'true' : 'false';
                        break
                    default:  // function, undefined.
                        s += 'null';
                        break;
                }
            }
            return s;
        }

        function writeString(v) {
            var s = '"';
            for (var i = 0; i < v.length; i++) {
                var ch = v.charAt(i);
                switch (ch) {
                    case '\"': s += '\\\"'; break;
                    case '\\': s += '\\\\'; break;
                    case '\/': s += '\\/'; break;
                    case '\b': s += '\\b'; break;
                    case '\f': s += '\\f'; break;
                    case '\n': s += '\\n'; break;
                    case '\r': s += '\\r'; break;
                    case '\t': s += '\\t'; break;
                    default:
                        var code = ch.charCodeAt(0);
                        if ((code >= 0x20 && code < 0x80) || (code >= 0x400 && code < 0x460)) {
                            s += ch;
                        }
                        else {
                            s += '\\u' + ('000' + code.toString(16)).slice(-4);
                        }
                        break;
                }
            }
            s += '"';
            return s;
        }

        function writeObject(v) {
            var s = '';
            if (v instanceof Array) {
                s += writeArray(v);
            } else if (v instanceof Date) {
                s += 'new Date(' + v.getTime() + ')';
            } else if (v instanceof Boolean) {
                s += (v) ? 'true' : 'false';
            } else if (v instanceof String) {
                s += writeString(v);
            } else if (v instanceof Number) {
                s += v;
            } else { // Math, RegExp ...
                s += '{';
                for (pr in v) { s += '"' + pr + '":' + writeValue(v[pr]) + ','; }
                if (s.slice(-1) == ',') s = s.slice(0, -1);
                s += '}';
            }
            return s;

            function writeArray(v) {
                var s = '[';
                for (var i = 0; i < v.length; i++) {
                    s += writeValue(v[i]) + ',';
                }
                if (s.slice(-1) == ',') s = s.slice(0, -1);
                s += ']';
                return s;
            }
        }
    }
};

﻿
Nskd = window.Nskd || {};

Nskd.Menu = function (domMenu, jsoMenu, selectedNodePath) {

    // private fields and constructor
    var selectedNode = null;

    // всё очистить
    Nskd.Dom.empty(domMenu);

    // рисуем меню (рекурсивно), если найдётся selectedNodePath, то будет заполнен selectedNode
    addDomNode(domMenu, jsoMenu, ''); //[' + jsoMenu.name + ']

    // пункт меню выбираем сразу
    if (selectedNode) {
        getDomHead(selectedNode).onclick();
    }

    // добавляем кнопку перехода
    var div = document.createElement('div');
    {
        div.style.marginTop = '20px';
        div.style.padding = '2px';
        div.style.backgroundColor = '#ccffcc';
        div.style.textAlign = "right";
        div.onclick = function () { Nskd.Server.gotoTheNewPage({ cmd: 'GotoFromMenu' }); };
        var span = document.createElement('span');
        {
            span.style.fontWeight = 'bold';
            var text = Nskd.Dom.create('#text', '------>>>');
            span.appendChild(text);
        }
        div.appendChild(span);
    }
    domMenu.appendChild(div);

    return;

    // private functions

    function addDomNode(domCont, jsoNode, nodePath) {
        var domNode = document.createElement('div');
        if ((nodePath == '') || (nodePath == '.' + selectedNodePath)) {
            selectedNode = domNode;
            //alert(selectedNodePath + ' == ' + nodePath);
        }
        domNode.className = 'nskdMenuNode ';
        domCont.appendChild(domNode);
        {
            addDomNodeHead(domNode, jsoNode, nodePath);
            addDomNodeCont(domNode, jsoNode, nodePath);
        }
        //return domNode;
    }

    function addDomNodeHead(domNode, jsoNode, nodePath) {
        var domHead = document.createElement('div');
        domHead.className = 'nskdMenuNodeHead ';
        domHead.onclick = menuNodeHeadOnclick;
        {
            addDomNodeHeadMark(domHead, jsoNode);
            addDomNodeHeadName(domHead, jsoNode);
        }
        domNode.appendChild(domHead);
    }

    function menuNodeHeadOnclick() {
        var domNode = this.parentNode;
        resetDomNodes();
        selectedNodePath = selectDomNode(domNode);
        // регистрируем выбор в параметрах среды
        Nskd.Client.EnvVars.selectedMenuNodePath = selectedNodePath;
    };

    function addDomNodeHeadMark(domHead, jsoNode) {
        var domMark = document.createElement('div');
        domMark.className = (jsoNode.cont.length > 0) ?
            'nskdMenuNodeHeadMark nskdMenuNodeHeadMark_plus' :
            'nskdMenuNodeHeadMark nskdMenuNodeHeadMark_leaf';
        domHead.appendChild(domMark);
    }

    function addDomNodeHeadName(domHead, jsoNode) {
        var domName = document.createElement('div');
        domName.className = 'nskdMenuNodeHeadName ';
        {
            var domNameSpan = document.createElement('span');
            {
                var text = Nskd.Dom.create('#text', jsoNode.name);
                domNameSpan.appendChild(text);
            }
            domName.appendChild(domNameSpan);
        }
        domHead.appendChild(domName);
    }

    function addDomNodeCont(domNode, jsoNode, nodePath) {
        var domCont = document.createElement('div');
        domCont.className = 'nskdMenuNodeCont ';
        for (var i = 0; i < jsoNode.cont.length; i++) {
            var node = jsoNode.cont[i];
            addDomNode(domCont, node, nodePath + '.[' + node.name + ']');
        }
        domNode.appendChild(domCont);
    }

    function resetDomNodes() {
        var divs = domMenu.getElementsByTagName('div');
        for (var i = 0; i < divs.length; i++) {
            var div = divs[i];
            if (div.className.indexOf('nskdMenuNode ') >= 0) {
                var head = getDomHead(div);
                head.style.backgroundColor = 'transparent';
                var cont = getDomCont(div);
                cont.style.paddingLeft = '0px';
                hide(div);
            }
        }
    }

    function selectDomNode(domNode) {
        var head = getDomHead(domNode);
        head.style.backgroundColor = '#ffff88';
        var selectedNodePath = showParentDomNodeChain(domNode);
        //showSiblingDomNodes(domNode);
        showChildDomNodes(domNode);
        return selectedNodePath;
    };

    function showParentDomNodeChain(domNode) {
        var selectedNodePath = '';
        var node = domNode;
        while (node) {
            var segment = node.firstChild.childNodes[1].firstChild.firstChild.nodeValue;
            selectedNodePath = '[' + segment + '].' + selectedNodePath;
            var cont = getDomCont(node);
            cont.style.paddingLeft = '0px';
            show(node);
            node = getParentDomNode(node);
        }
        selectedNodePath = selectedNodePath.substring(0, (selectedNodePath.length - 1));
        return selectedNodePath;
    }

    function showSiblingDomNodes(domNode) {
        var node = getParentDomNode(domNode);
        if (node) {
            showChildDomNodes(node);
        }
    }

    function showChildDomNodes(domNode) {
        var cont = getDomCont(domNode);
        cont.style.paddingLeft = '8px';
        var nodes = cont.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            show(nodes[i]);
        }
    }

    function show(domNode) { domNode.style.display = 'block'; }

    function hide(domNode) { domNode.style.display = 'none'; }

    function getDomHead(domNode) { return domNode.childNodes[0]; }

    function getDomCont(domNode) { return domNode.childNodes[1]; }

    function getParentDomNode(domNode) {
        p = domNode.parentNode.parentNode;
        return ((p.className.indexOf('nskdMenuNode ') >= 0) ? p : null);
    }
};
﻿
Nskd = window.Nskd || {};

Nskd.Server = {};

Nskd.Server.SessionId = null;
Nskd.Server.EncryptedKeyMessage = null;
Nskd.Server.CryptServiceProvider = null;

Nskd.Server.HttpRequest = {
    post: function (url, data, done, fail) {
        var xhr = new XMLHttpRequest();
        if (xhr != null) {
            xhr.open('POST', url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        //alert(xhr.responseText.charAt(0));
                        done(xhr.responseText);
                    } else {
                        fail(xhr.status.toString());
                    }
                }
            };
            xhr.send(data);
        }
    }
};

Nskd.Server.SessionRequest = {
    post: function (url, data, done, fail) {
        // добавляем заголовок
        data = Nskd.Server.SessionId + '\r\n' + data;
        // отправляем
        Nskd.Server.HttpRequest.post(url, data, done, fail);
    }
};

Nskd.Server.CryptRequest = {
    post: function (url, data, done, fail) {
        // шифрование
        data = Nskd.Convert.stringToUtf8Array(data);
        data = Nskd.Server.CryptServiceProvider.encrypt(data);
        data = Nskd.Convert.byteArrayToBase64String(data);
        // добавляем заголовок с ключём (нужен только первый раз.)
        if (Nskd.Server.EncryptedKeyMessage != null) {
            data = Nskd.Convert.byteArrayToBase64String(Nskd.Server.EncryptedKeyMessage) + '\r\n' + data;
        }
        // отправляем
        Nskd.Server.SessionRequest.post(url, data, __done, fail);
        // обрабатываем ответ
        function __done(data) {
            if (data.charAt(0) != '<') { // некоторые сообщения приходят не зашифрованными
                // дешифрование
                data = Nskd.Convert.base64StringToByteArray(data);
                data = Nskd.Server.CryptServiceProvider.decrypt(data);
                data = Nskd.Convert.utf8ArrayToString(data);
            }
            done(data);
        }
    }
};

Nskd.Server.JsonRequest = {
    post: function (url, data, done, fail) {
        var json = Nskd.Json.toString(data);
        //alert(json);
        Nskd.Server.CryptRequest.post(url, json, _done, fail);
        function _done(text) {
            if (text.charAt(0) == '{') {
                var object = Nskd.Json.parse(text);
                done(object);
            } else done(text);
        }
    }
};

Nskd.Server.gotoTheNewPage = function (data) {
    if (Nskd.Js.is(data, 'object')) {
        data.cmdType = 'GotoTheNewPage';
        data.envVars = Nskd.Client.EnvVars;
        // отправляем пакет на сервер с указанием что делать с ответом (_done) и с ошибкой (_fail)
        Nskd.Server.JsonRequest.post('/', data, _done, _fail);

        // пока ждём - считаем секунды
        _showTheWaitMessage();
    }
    return;

    function _done(pack) {

        if ((typeof pack) === 'object') {
            __gotoNewPage(pack.data);
        } else if ((typeof pack) === 'string') __gotoNewPage(pack);

        function __gotoNewPage(html) {
            // добавляем данные для передачи на следующую страницу
            var i = html.indexOf('</head>');
            var content = html.substring(0, i) +
            '\n<script>\n' +
            ' window.onload = function () { \n' +
            '  var key = [' + Nskd.Server.CryptServiceProvider.getKey().toString() + '];\n' +
            '  if ((typeof Nskd) != \'undefined\') {\n' +
            '    Nskd.Server.SessionId = \'' + Nskd.Server.SessionId + '\';\n' +
            '    Nskd.Server.EncryptedKeyMessage = null;\n' +
            '    Nskd.Server.CryptServiceProvider = new Nskd.Crypt.aes(key);\n' +
            '  }\n' +
            ' };\n' +
            '</script>\n' +
            html.substring(i);
            // готово
            document.write(content);
            document.close();
        }
    }

    function _fail(status) {
        alert('Error: XMLHttpRequest.status = ' + status);
    }

    function _showTheWaitMessage() {
        var body = document.body;
        Nskd.Dom.empty(body);
        var div = document.createElement('div');
        body.appendChild(div);
        div.appendChild(Nskd.Dom.create('#text', 'Запрос отправлен на сервер. Ожидается ответ. '));
        var span = document.createElement('span');
        div.appendChild(span);
        var count = 0;
        __showCount();
        return;

        function __showCount() {
            Nskd.Dom.empty(span);
            span.appendChild(Nskd.Dom.create('#text', count++));
            if (count < 100) setTimeout(__showCount, 1000);
        }
    }
};

Nskd.Server.execute = function (data, done) {
    if (Nskd.Js.is(data, 'object')) {
        data.cmdType = 'Execute';
        data.envVars = Nskd.Client.EnvVars;
        Nskd.Server.JsonRequest.post('/', data, _done, _fail);
    }
    function _done(pack) {
        if (Nskd.Js.is(pack, 'object')) {
            if (pack.err) {
                _fail(pack.data);
            } else {
                done(pack.data);
            }
        } else if (Nskd.Js.is(pack, 'string')) {
            if (pack.length == 0) {
                alert('Nskd.Server.execute: Response type is "string" with zero length.');
            } else {
                alert('Nskd.Server.execute: Response type is "string". ' + pack);
            }
        } else {
            alert('Nskd.Server.execute: Response type is "' + (typeof pack) + '". ' + pack.toString());
        }
    }
    function _fail(msg) {
        alert('Nskd.Server.execute: ' + msg);
    }
};

Nskd.Server.downloadFile = function (id) {
    var body = document.body;
    var guid = Nskd.Js.guid();
    var iframe = Nskd.Dom.create('iframe', { name: guid }, { display: 'none' }); {
        iframe.onload = function () { body.removeChild(iframe); iframe = null; };
        body.appendChild(iframe);
    }
    var form = Nskd.Dom.create(
        'form',
        { method: 'post', action: '/', target: guid, enctype: 'multipart/form-data' },
        { display: 'none' }); {
            form.onsubmit = function () { return false; };
            form.appendChild(Nskd.Dom.create('input', { type: 'hidden', name: 'cmd', value: 'download' }));
            form.appendChild(Nskd.Dom.create('input', { type: 'hidden', name: 'id', value: id }));
            body.appendChild(form);
        }
    form.submit();
    body.removeChild(form);
    form = null;
};
