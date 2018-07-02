
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

