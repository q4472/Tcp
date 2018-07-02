
window.onload = function () {
    var rsaModule = document.getElementById('p_rsaModule');
    var rsaExponent = document.getElementById('p_rsaExponent');
    var module = Nskd.Convert.base64StringToByteArray(rsaModule.value);
    var exponent = Nskd.Convert.base64StringToByteArray(rsaExponent.value);
    var key = getRandomBytes(32);
    var encryptedKeyMessage = rsaEncryptMessage(module, exponent, key);

    Nskd.Server.SessionId = document.getElementById('p_sessionId').value;
    Nskd.Server.EncryptedKeyMessage = encryptedKeyMessage;
    Nskd.Server.CryptServiceProvider = new Nskd.Crypt.aes(key);

    return;

    function getRandomBytes(size) {
        var bytes = [];
        for (var i = 0; i < size; i++) {
            bytes.push((Math.random() * 256) | 0);
        }
        return bytes;
    }

    function rsaEncryptMessage(bModule, bExponent, bMessage) {
        var k = bModule.length;
        var nModule = Nskd.Convert.byteArrayToBigInteger(bModule);
        var nExponent = Nskd.Convert.byteArrayToBigInteger(bExponent);
        var pm = pad2(bMessage);
        var c = (new BigInteger(pm)).modPow(nExponent, nModule);
        return Nskd.Convert.bigIntegerToByteArray(c);
        function pad2(m) { // byte[] byte[]
            pm = [];
            var psc = k - 3 - m.length;
            if (psc < 8) throw "Message too long for RSA (k=" + k + ", l=" + m.length + ")";
            pm.push(0);
            pm.push(2);
            while (--psc >= 0) pm.push(((Math.random() * 255) | 0) + 1);
            pm.push(0);
            for (var i = 0; i < m.length; i++) pm.push(m[i]);
            return pm;
        }
    };
};

function login() {
    var username = document.getElementById('p_username');
    var password = document.getElementById('p_password');
    var token = '<token>' +
        '<name>' + username.value + '</name>' +
        '<password>' + password.value + '</password>' +
        '</token>';
    var userId = MD5(token); //'<userId>' + MD5(token) + '</userId>';
    Nskd.Server.gotoTheNewPage({ 'cmd': 'Login', 'userId': userId });
}

function generatePassword() {
    var p = '';
    for (var i = 0; i < 7; i++) {
        if (Math.random() < 10 / (10 + 26))
            p += String.fromCharCode(48 + Math.floor(Math.random() * 10));
        else
            p += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    var gpw = document.getElementById('p_gpw');
    Nskd.Dom.empty(gpw);
    gpw.appendChild(Nskd.Dom.create('#text', p));
    var password = document.getElementById('p_password');
    password.setAttribute('value', p);
}

