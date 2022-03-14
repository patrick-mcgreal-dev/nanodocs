const fs = require('fs');

function checkPathExists (path) {

    if (!fs.existsSync(path)) {
        throw new Error(`directory or file "${path}" does not exist`);
    }

}

function escapeLinkText(input) {

    return input
        .toLowerCase()
        .replace(/[^A-Za-z0-9.\s]/g, '') // remove everything but alphanumerics, dots, and spaces
        .replace(/\s+\s/g, ' ') // collapse consecutive spaces down into a single space
        .replace(/\s/g, '-') // replace spaces with dashes
        .replace(/\-$/g, ''); // remove trailing dashes at the end of the string

}

module.exports = {
    checkPathExists,
    escapeLinkText
}