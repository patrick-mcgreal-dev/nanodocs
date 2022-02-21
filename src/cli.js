#!/usr/bin/env node

const chalk = require('chalk');
const { init } = require('./init.js');
const { build } = require('./build.js');

const args = process.argv;
const commands = [ 'init', 'build' ];

if (args.length < 3) {
    usage();
    return;
}

if (args.length > 3) {
    logError('nanodocs only accepts a single argument');
    usage();
    return;
}

if (commands.indexOf(args[2]) == -1) {
    logError(`'${args[2]}' is not a valid nanodocs command`);
    usage();
    return;
}

switch (args[2]) {
    case 'init': runProcess(init); break;
    case 'build': runProcess(build); break;
    default: usage(); break;
}

function usage() {
    const text = `
nanodocs is a tool for generating online documentation.

Usage: 
    nanodocs <command>

    valid commands:

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

function runProcess(procFunction) {
    const response = procFunction();
    if (response.error) {
        logError(response.message);
    } else {
        logSuccess(response.message);
    }
}