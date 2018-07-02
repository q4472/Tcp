Nskd = window.Nskd || {};

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

