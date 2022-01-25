#!/usr/bin/env node

const chalk = require('chalk');
const { init } = require('./init.js');
const { build } = require('./build.js');

const ARGS = process.argv;
const COMMANDS = [ 'init', 'build' ];

if (ARGS.length < 3) {
    usage();
    return;
}

if (ARGS.length > 3) {
    logError('nanodocs only accepts a single argument');
    usage();
    return;
}

if (COMMANDS.indexOf(ARGS[2]) == -1) {
    logError(`'${ARGS[2]}' is not a valid nanodocs command`);
    usage();
    return;
}

switch (ARGS[2]) {
    case 'init': runProcess(init); break;
    case 'build': runProcess(build); break;
    default: usage(); break;
}

function usage() {
    const text = `
nanodocs is a tool for generating online documentation.

Usage: 
    nanodocs <command>

    valid COMMANDS:

    init: initialise nanodocs in the working directory
    build: build documentation to the nanodocs/build folder
`;

    console.log(text);
}

function logError(message) {
    const log = chalk.red('[nanodocs] ' + message);
    console.log(log);
}

function logSuccess(message) {
    const log = chalk.green('[nanodocs] ' + message);
    console.log(log);
}

function runProcess(func) {
    const response = func();
    if (response.error) {
        logError(response.message);
    } else {
        logSuccess(response.message);
    }
}