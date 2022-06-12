'use strict';

var fs = require('fs');
var process = require('process');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

const registers = new Array(8);
const branches = {};
let noline;
let result;
function logError(errorText) {
    console.error(`Error l.${noline}: ${errorText}`);
    process.exit(1);
}
function isRegister(register) {
    return (register.startsWith('R') || register.startsWith('r'))
        && !isNaN(parseInt(register.substring(1)));
}
function getRegister(register) {
    if (!isRegister(register))
        logError(`Bad register: ${register}`);
    return registers[parseInt(register.substring(1))];
}
function setRegister(register, value) {
    if (!isRegister(register))
        logError(`Bad register: ${register}`);
    registers[parseInt(register.substring(1))] = value;
}
function getOperand(operand) {
    if (operand.startsWith('#')) {
        const r = parseInt(operand.substring(1));
        if (!isNaN(r))
            return r;
    }
    if (isRegister(operand))
        return getRegister(operand);
    logError(`Invalid operand: ${operand}`);
}
function goToBranch(branch, condition = true) {
    if (condition) {
        const nolineBranch = branches[branch];
        if (nolineBranch === undefined)
            logError(`Branch ${branch} not found`);
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
const commands = {
    out: (...texts) => { console.log(...texts.map(getOperand)); },
    halt: () => { process.exit(); },
    mov: (output, input) => { setRegister(output, getOperand(input)); },
    add: (output, arg1, arg2) => {
        const number1 = anyToNumber(getOperand(arg1));
        const number2 = anyToNumber(getOperand(arg2));
        setRegister(output, number1 + number2);
    },
    sub: (output, arg1, arg2) => {
        const number1 = anyToNumber(getOperand(arg1));
        const number2 = anyToNumber(getOperand(arg2));
        setRegister(output, number1 - number2);
    },
    cmp: (arg1, arg2) => {
        const result1 = getOperand(arg1);
        const result2 = getOperand(arg2);
        result = result1 < result2
            ? 'less'
            : result1 > result2
                ? 'greater'
                : 'equal';
    },
    b: (label) => { goToBranch(label); },
    beq: (label) => { goToBranch(label, result === 'equal'); },
    bne: (label) => { goToBranch(label, result !== 'equal'); },
    bgt: (label) => { goToBranch(label, result === 'greater'); },
    blt: (label) => { goToBranch(label, result === 'less'); }
};
const inputFileName = process.argv[2];
if (inputFileName === undefined) {
    console.error('Please enter an input file name');
    process.exit(1);
}
fs__default['default'].readFile(inputFileName, (err, data) => {
    var _a, _b;
    if (err) {
        if (err.code === 'ENOENT') {
            console.error(`no such file or directory: ${inputFileName}`);
            process.exit(1);
        }
        throw err;
    }
    const lines = data.toString().split('\n');
    for (const i in lines) {
        const line = lines[i].trim();
        if (line.endsWith(':')) {
            branches[line.substring(0, line.length - 1)] = parseInt(i);
            continue;
        }
    }
    noline = 0;
    while (noline < lines.length) {
        noline++;
        const line = lines[noline - 1].trim();
        if (line === '')
            continue;
        if (line.startsWith(';'))
            continue;
        if (line.endsWith(':'))
            continue;
        let found = false;
        for (const j in commands) {
            const match = new RegExp(`^${j}(?: +(.*))?$`, 'i').exec(line);
            if (match) {
                const args = (_b = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.split(',')) === null || _b === void 0 ? void 0 : _b.map(arg => arg.trim());
                args ? commands[j](...args) : commands[j]();
                found = true;
                break;
            }
        }
        if (!found)
            logError('Unknown command');
    }
});
