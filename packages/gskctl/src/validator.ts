const variableNameRegex = /^[a-zA-Z][a-zA-Z_]*$/;
const urlRegex = /^(([a-zA-Z0-9]{1,63}\.)+[a-zA-Z]{2,6})(:[0-9]{1,5})?(\/[a-zA-Z0-9-_./]*)?(\?[a-zA-Z0-9-_=&]*)?(#[a-zA-Z0-9-_]*)?$/;

const reservedWords = new Set([
    'abstract', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
    'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double',
    'else', 'enum', 'export', 'extends', 'false', 'final', 'finally', 'float',
    'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof',
    'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'package', 'private',
    'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized',
    'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void',
    'volatile', 'while', 'with', 'yield'
]);

export const validateName = (name: string): boolean => {

    if (!variableNameRegex.test(name)) {
        return false;
    }
    if (reservedWords.has(name)) {
        return false;
    }
    return true;
}

export const validatePrefix = (prefix: string): boolean => {
    return urlRegex.test(prefix)
}