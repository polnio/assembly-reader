"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var fs_1 = __importDefault(require("fs"));
var process_1 = require("process");
var registers = new Array(8);
var branches = {};
var noline;
var result;
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
function goToBranch(branch, condition) {
    if (condition === void 0) { condition = true; }
    if (condition) {
        var nolineBranch = branches[branch];
        if (nolineBranch === undefined)
            logError("Branch ".concat(branch, " not found"));
        noline = nolineBranch;
    }
}
function anyToNumber(thing) {
    if (typeof thing === 'number')
        return thing;
    if (typeof thing === 'string')
        return parseInt(thing);
    return NaN;
}
var commands = {
    out: function () {
        var texts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            texts[_i] = arguments[_i];
        }
        console.log.apply(console, texts.map(getOperand));
    },
    halt: function () { (0, process_1.exit)(); },
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
    },
    cmp: function (arg1, arg2) {
        var result1 = getOperand(arg1);
        var result2 = getOperand(arg2);
        result = result1 < result2
            ? 'less'
            : result1 > result2
                ? 'greater'
                : 'equal';
    },
    b: function (label) { goToBranch(label); },
    beq: function (label) { goToBranch(label, result === 'equal'); },
    bne: function (label) { goToBranch(label, result !== 'equal'); },
    bgt: function (label) { goToBranch(label, result === 'greater'); },
    blt: function (label) { goToBranch(label, result === 'less'); }
};
fs_1["default"].readFile('test/test.txt', function (err, data) {
    var _a, _b;
    if (err)
        throw err;
    var lines = data.toString().split('\n');
    for (var i in lines) {
        var line = lines[i].trim();
        if (line.endsWith(':')) {
            branches[line.substring(0, line.length - 1)] = parseInt(i);
            continue;
        }
    }
    noline = 0;
    while (noline < lines.length) {
        noline++;
        var line = lines[noline - 1].trim();
        if (line === '')
            continue;
        if (line.startsWith(';'))
            continue;
        if (line.endsWith(':'))
            continue;
        var found = false;
        for (var j in commands) {
            var match = new RegExp("^".concat(j, "(?: +(.*))?$"), 'i').exec(line);
            if (match) {
                var args = (_b = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.split(',')) === null || _b === void 0 ? void 0 : _b.map(function (arg) { return arg.trim(); });
                args ? commands[j].apply(commands, args) : commands[j]();
                found = true;
                break;
            }
        }
        if (!found)
            logError('Unknown command');
    }
});
