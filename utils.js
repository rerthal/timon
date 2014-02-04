exports.underscored = function utilsUnderscored(str) {
    return str.replace(/([a-z\d])([A-Z]+)/g, '$1_$2');
};
