const path = require('path');
const fs = require('fs-extra');
const resolvePkg = require('resolve-package-path');

const ssg = require('../lib/nano-ssg');
const csso = require('csso');

const THEMES = [ 'default' ];
let ANCHOR_SEPARATOR;

function main() {

    try {

        const WORKING_DIR = process.cwd();
        const MODULE_DIR = path.join(resolvePkg('nanodocs', WORKING_DIR), '../');
        const CONFIG = require(path.join(WORKING_DIR, 'nanodocs', 'config.json'));

        ANCHOR_SEPARATOR = CONFIG.anchorSeparator ?? '+';

        const nanodocsDir = path.join(WORKING_DIR, 'nanodocs');

        const documentationDir = path.join(nanodocsDir, 'documentation');
        ssg.checkDirExists(documentationDir);

        const buildDir = path.join(nanodocsDir, 'build');
        ssg.checkDirExists(buildDir);

        const customTheme = THEMES.indexOf(CONFIG.theme.name) == -1;
        const themeDir = customTheme 
            ? path.join(WORKING_DIR, 'themes', CONFIG.theme.name)
            : path.join(MODULE_DIR, 'themes', CONFIG.theme.name);

        ssg.checkDirExists(themeDir);

        const css = csso.minify(ssg.compileStyle(path.join(themeDir, 'stylesheets', 'docs.scss'))).css;

        const fontClass = 'fontSize-' + CONFIG.theme.fontSize;
        const themeVariantClass = 'themeVariant-' + CONFIG.theme.variant;

        const docsData = {
            title: CONFIG.title,
            docTree: getDocTree(documentationDir, CONFIG.docs),
            css: css,
            anchorSeparator: ANCHOR_SEPARATOR,
            fontClass: fontClass,
            themeVariantClasses: themeVariantClass,
            downloadEnabled: CONFIG.downloadEnabled
        }

        ssg.renderPage(path.join(themeDir, 'docs.ejs'), path.join(buildDir, 'index.html'), docsData);

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

function getDocTree(dir, docStructure, folderName) {

    let tree = [];

    for (let item of docStructure) {

        let isParent = typeof item != 'string';

        if (isParent) {

            let folderPath = path.join(dir, item.folder);
            ssg.checkDirExists(folderPath, `Can't find a folder called "${item.folder}" in directory "${dir}". Please create this folder or remove it from your config.json.`);

            tree.push({
                type: 'folder',
                header: escapeLinkText(item.folder),
                files: getDocTree(folderPath, item.files, item.folder)
            });

        } else {

            let filePath = path.join(dir, item + '.md');
            ssg.checkDirExists(filePath, `Can't find a file called "${item + '.md'}" in directory "${dir}". Please create this file or remove it from your config.json.`);

            let tokens = ssg.tokenizeMarkdown(filePath);
            let header = tokens.find(t => t.type == 'heading' && t.depth == 1);

            folderName = folderName ?? 'root';
            let anchor = escapeLinkText(folderName).concat(ANCHOR_SEPARATOR, escapeLinkText(header.text));

            let content = ssg.parseMarkdown(filePath, getMarkedRenderer(anchor));

            tree.push({
                type: 'file',
                id: anchor,
                header: header.text,
                content: content
            });

        }

    }

    return tree;

}

function getMarkedRenderer(fileAnchor) {

    return {
        heading(text, level) {
            if (level == 1) {
                return `<h${level} name="${fileAnchor}">${text}</h${level}>`;
            } else {
                let headerAnchor = fileAnchor ? fileAnchor.concat(ANCHOR_SEPARATOR, escapeLinkText(text)) : escapeLinkText(text);
                return `<h${level} name="${headerAnchor}">${text}</h${level}>`;
            }
        }   
    }
    
}

function escapeLinkText(input) {
    return input
        .toLowerCase()
        .replace(/[^\w]/g, '-')
        .replace(/\-$/g, '');
}

module.exports = {
    build: main
}