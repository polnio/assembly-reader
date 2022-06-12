import fs from 'fs'
import { exit, argv } from 'process'

const registers = new Array(8)
const branches: {[key: string]: number} = {}
let noline: number
let result: 'equal' | 'greater' | 'less'

function logError (errorText: string) {
    console.error(`Error l.${noline}: ${errorText}`)
    exit(1)
}

function isRegister (register: string) {
    return (register.startsWith('R') || register.startsWith('r'))
        && !isNaN(parseInt(register.substring(1)))
}

function getRegister (register: string) {
    if (!isRegister(register)) logError(`Bad register: ${register}`)
    return registers[parseInt(register.substring(1))]
}

function setRegister (register: string, value: any) {
    if (!isRegister(register)) logError(`Bad register: ${register}`)
    registers[parseInt(register.substring(1))] = value
}

function getOperand (operand: string) {
    if (operand.startsWith('#')) {
        const r = parseInt(operand.substring(1))
        if (!isNaN(r)) return r
    }
    if (isRegister(operand)) return getRegister(operand)
    logError(`Invalid operand: ${operand}`)
}

function goToBranch (branch: string, condition = true) {
    if (condition) {
        const nolineBranch = branches[branch]
        if (nolineBranch === undefined) logError(`Branch ${branch} not found`)
        noline = nolineBranch
    }
}

function anyToNumber (thing: any) {
    if (typeof thing === 'number') return thing
    if (typeof thing === 'string') return parseInt(thing)
    return NaN
}

const commands = {
    out: (...texts: string[]) => { console.log(...texts.map(getOperand)) },
    halt: () => { exit() },
    mov: (output: string, input: string) => { setRegister(output, getOperand(input)) },
    add: (output: string, arg1: string, arg2: string) => {
        const number1 = anyToNumber(getOperand(arg1))
        const number2 = anyToNumber(getOperand(arg2))
        setRegister(output, number1 + number2)
    },
    sub: (output: string, arg1: string, arg2: string) => {
        const number1 = anyToNumber(getOperand(arg1))
        const number2 = anyToNumber(getOperand(arg2))
        setRegister(output, number1 - number2)
    },
    cmp: (arg1: string, arg2: string) => {
        const result1 = getOperand(arg1)
        const result2 = getOperand(arg2)
        result = result1 < result2
            ? 'less'
            : result1 > result2
                ? 'greater'
                : 'equal'
    },
    b: (label: string) => { goToBranch(label) },
    beq: (label: string) => { goToBranch(label, result === 'equal') },
    bne: (label: string) => { goToBranch(label, result !== 'equal') },
    bgt: (label: string) => { goToBranch(label, result === 'greater') },
    blt: (label: string) => { goToBranch(label, result === 'less') }
}

const inputFileName = argv[2]
if (inputFileName === undefined) {
    console.error('Please enter an input file name')
    exit(1)
}
fs.readFile(inputFileName, (err, data) => {
    if (err) {
        if (err.code === 'ENOENT') {
            console.error(`no such file or directory: ${inputFileName}`)
            exit(1)
        }
        throw err
    }

    const lines = data.toString().split('\n')
    for (const i in lines) {
        const line = lines[i].trim()
        if (line.endsWith(':')) {
            branches[line.substring(0, line.length - 1)] = parseInt(i)
            continue
        }
    }

    noline = 0
    while (noline < lines.length) {
        noline++
        const line = lines[noline - 1].trim()
        if (line === '') continue
        if (line.startsWith(';')) continue
        if (line.endsWith(':')) continue

        let found = false
        for (const j in commands) {
            const match = new RegExp(`^${j}(?: +(.*))?$`, 'i').exec(line)
            if (match) {
                const args = match[1]?.split(',')?.map(arg => arg.trim())
                args ? commands[j](...args) : commands[j]()
                found = true
                break
            }
        }
        if (!found) logError('Unknown command')
    }
})
