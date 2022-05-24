"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs_1 = __importDefault(require("fs"));
var process_1 = require("process");
var registers = new Array(8);
var noline = 1;
function logError(errorText) {
    console.error("Error l.".concat(noline, ": ").concat(errorText));
    (0, process_1.exit)(1);
}
function isRegister(register) {
    return (register.startsWith('R') || register.startsWith('r'))
        && !isNaN(parseInt(register.substring(1)));
}
function getRegister(register) {
    if (!isRegister(register))
        logError("Bad register: ".concat(register));
    return registers[parseInt(register.substring(1))];
}
function setRegister(register, value) {
    if (!isRegister(register))
        logError("Bad register: ".concat(register));
    registers[parseInt(register.substring(1))] = value;
}
function getOperand(operand) {
    if (operand.startsWith('#')) {
        var r = parseInt(operand.substring(1));
        if (!isNaN(r))
            return r;
    }
    if (isRegister(operand))
        return getRegister(operand);
    logError("Invalid operand: ".concat(operand));
}
function anyToNumber(thing) {
    if (typeof thing === 'number')
        return thing;
    if (typeof thing === 'string')
        return parseInt(thing);
    return NaN;
}
var commands = {
    out: function (text) { console.log(getOperand(text)); },
    mov: function (output, input) { setRegister(output, getOperand(input)); },
    add: function (output, arg1, arg2) {
        var number1 = anyToNumber(getOperand(arg1));
        var number2 = anyToNumber(getOperand(arg2));
        setRegister(output, number1 + number2);
    },
    sub: function (output, arg1, arg2) {
        var number1 = anyToNumber(getOperand(arg1));
        var number2 = anyToNumber(getOperand(arg2));
        setRegister(output, number1 - number2);
    }
};
fs_1["default"].readFile('test/test.txt', function (err, data) {
    if (err)
        throw err;
    var lines = data.toString().split('\n');
    while (noline <= lines.length) {
        var line = lines[noline - 1];
        if (line.trim() === '') {
            noline++;
            continue;
        }
        var found = false;
        for (var j in commands) {
            var match = new RegExp("^".concat(j, "(?: +(.*))?"), 'i').exec(line);
            if (match) {
                var args = match[1].split(',').map(function (arg) { return arg.trim(); });
                commands[j].apply(commands, args);
                found = true;
                break;
            }
        }
        if (!found)
            logError('Unknown command');
        noline++;
    }
});
