const path = require('path');
const fs = require('fs-extra');
const resolvePkg = require('resolve-package-path');
const ssg = require('../lib/nano-ssg');

const THEMES = [ 'default' ];

function main() {

    try {

        const WORKING_DIR = process.cwd();
        const MODULE_DIR = path.join(resolvePkg('nanodocs', WORKING_DIR), '../');
        const CONFIG = require(path.join(WORKING_DIR, 'nanodocs', 'config.json'));

        const nanodocsDir = path.join(WORKING_DIR, 'nanodocs');

        const documentationDir = path.join(nanodocsDir, 'documentation');
        ssg.checkDirExists(documentationDir);

        const buildDir = path.join(nanodocsDir, 'build');
        ssg.checkDirExists(buildDir);

        const customTheme = THEMES.indexOf(CONFIG.theme) == -1;
        const themeDir = customTheme 
            ? path.join(WORKING_DIR, 'themes', CONFIG.theme)
            : path.join(MODULE_DIR, 'themes', CONFIG.theme);

        ssg.checkDirExists(themeDir);

        const docsData = {
            title: CONFIG.title,
            docTree: getDocTree(documentationDir, CONFIG.docs)
        }

        ssg.renderPage(path.join(themeDir, 'docs.ejs'), path.join(buildDir, 'index.html'), docsData);
        ssg.renderStyle(path.join(themeDir, 'stylesheets', 'docs.scss'), path.join(buildDir, 'index.css'));

        if (CONFIG.copyThemeAssets) {

            const assetsSrcDir = path.join(themeDir, 'assets');
            ssg.checkDirExists(assetsSrcDir);

            const assetsDestDir = path.join(buildDir, 'assets');

            fs.rmSync(assetsDestDir, { recursive: true, force: true });
            fs.copySync(assetsSrcDir, assetsDestDir, { overwrite: true });
    
        }

        return {
            error: false,
            message: 'Your documentation was successfully built to the nanodocs/build folder.'
        }

    } catch (error) {

        return {
            error: true,
            message: error.message
        };

    }

}

function getDocTree(dir, docStructure) {

    let tree = [];

    for (let item of docStructure) {

        let isParent = typeof item != 'string';

        if (isParent) {

            let folderPath = path.join(dir, item.folder);
            ssg.checkDirExists(folderPath, `Can't find a folder called "${item.folder}" in directory "${dir}. Please create this folder or remove it from your config.json.`);

            tree.push({
                type: 'folder',
                header: item.folder,
                files: getDocTree(folderPath, item.files)
            });

        } else {

            let filePath = path.join(dir, item + '.md');
            ssg.checkDirExists(filePath, `Can't find a file called "${item + '.md'}" in directory "${dir}. Please create this file or remove it from your config.json.`);

            let tokens = ssg.tokenizeMarkdown(filePath);
            let header = tokens.find(t => t.type == 'heading' && t.depth == 1);

            let content = ssg.parseMarkdown(filePath, getMarkedRenderer());

            tree.push({
                type: 'file',
                id: getAnchorLinkText(header.text),
                header: header.text,
                content: content
            });

        }

    }

    return tree;

}

function getMarkedRenderer() {

    let lastFirstLevelText = '';

    return {
        heading(text, level) {
            const escapedText = getAnchorLinkText(text);
            if (level == 1) {
                lastFirstLevelText = escapedText;
                return `<h${level} name="${escapedText}">${text}</h${level}>`;
            } else {
                return `<h${level} name="${lastFirstLevelText + '+' + escapedText}">${text}</h${level}>`;
            }
        }   
    }
}

function getAnchorLinkText(input) {
    return input
        .toLowerCase()
        .replace(/[^\w]/g, '-')
        .replace(/\-$/g, '');
}

module.exports = {
    build: main
}