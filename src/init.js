const path = require('path');
const fs = require('fs');
const resolvePkg = require('resolve-package-path');

function main() {

    try {
    
        const dirWorking = process.cwd();
        const dirNanodocs = path.join(dirWorking, 'nanodocs');
        const dirModule = path.join(resolvePkg('nanodocs', dirWorking), '../');

        if (fs.existsSync(dirNanodocs)) {
            return {
                error: true,
                message: 'There is already a folder called \'nanodocs\' in the working directory. Please remove this folder before trying again.' 
            };
        }

        fs.mkdirSync(dirNanodocs);
        fs.mkdirSync(path.join(dirNanodocs, 'documentation'));
        fs.mkdirSync(path.join(dirNanodocs, 'build'));
        fs.copyFileSync(path.join(dirModule, 'src', 'init-config.json'), path.join(dirNanodocs, 'config.json'));

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