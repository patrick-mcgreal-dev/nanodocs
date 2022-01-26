const path = require('path');
const fs = require('fs');
const resolvePkg = require('resolve-package-path');

function main() {

    try {
    
        const WORKING_DIR = process.cwd();
        const NANODOCS_DIR = path.join(WORKING_DIR, 'nanodocs');
        const MODULE_DIR = path.join(resolvePkg('nanodocs', WORKING_DIR), '../');

        if (fs.existsSync(NANODOCS_DIR)) {
            return {
                error: true,
                message: 'There is already a folder called \'nanodocs\' in the working directory. Please remove this folder before trying again.' 
            };
        }

        fs.mkdirSync(NANODOCS_DIR);
        fs.mkdirSync(path.join(NANODOCS_DIR, 'documentation'));
        fs.mkdirSync(path.join(NANODOCS_DIR, 'themes'));
        fs.mkdirSync(path.join(NANODOCS_DIR, 'build'));
        fs.copyFileSync(path.join(MODULE_DIR, 'src', 'init-config.json'), path.join(NANODOCS_DIR, 'config.json'));

        return {
            error: false,
            message: 'nanodocs was successfully initialised in the working directory.'
        };

    } catch (error) {

        return {
            error: true,
            message: error.message
        };

    }

}

module.exports = {
    init: main
}