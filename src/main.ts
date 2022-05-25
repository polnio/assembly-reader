import fs from 'fs'
import { exit } from 'process'

const registers = new Array(8)
let noline = 0

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

function anyToNumber (thing: any) {
    if (typeof thing === 'number') return thing
    if (typeof thing === 'string') return parseInt(thing)
    return NaN
}

const commands = {
    out: (text: any) => { console.log(getOperand(text)) },
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
    }
}

fs.readFile('test/test.txt', (err, data) => {
    if (err) throw err

    const lines = data.toString().split('\n')

    while (noline < lines.length) {
        noline++
        const line = lines[noline - 1]
        if (line.trim() === '') continue

        let found = false
        for (const j in commands) {
            const match = new RegExp(`^${j}(?: +(.*))?`, 'i').exec(line)
            if (match) {
                const args = match[1].split(',').map(arg => arg.trim())
                commands[j](...args)
                found = true
                break
            }
        }
        if (!found) logError('Unknown command')
    }
})
