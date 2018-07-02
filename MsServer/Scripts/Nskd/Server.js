
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
