const path = require('path');
const fs = require('fs-extra');
const resolvePkg = require('resolve-package-path');

const ejs = require('ejs');
const sass = require('sass');
const csso = require('csso');
const marked = require('marked');

const utils = require('./utils');
const markedRenderers = require('./marked-renderers');

const themes = [ 'default' ];
const anchorSeparator = '+';

let config;
let dirAssets;

function main() {

    try {

        // get user directories

        const dirWorking = process.cwd();
        const dirModule = path.join(resolvePkg('nanodocs', dirWorking), '../');

        // get/check nanodocs directories

        const dirNanodocs = path.join(dirWorking, 'nanodocs');
        utils.checkPathExists(dirNanodocs);

        const dirDocumentation = path.join(dirNanodocs, 'contents', 'documentation');
        utils.checkPathExists(dirDocumentation);

        dirAssets = path.join(dirNanodocs, 'contents', 'assets');
        utils.checkPathExists(dirAssets);

        const dirBuild = path.join(dirNanodocs, 'build');
        utils.checkPathExists(dirBuild);

        // get config

        config = require(path.join(dirWorking, 'nanodocs', 'config.json'));

        // get/check theme directory

        const customTheme = themes.indexOf(config.theme.name) == -1;
        let themeDir;

        if (customTheme) {
            themeDir = path.join(dirWorking, 'themes', config.theme.name);
        } else {
            themeDir = path.join(dirModule, 'themes', config.theme.name);
        }   

        utils.checkPathExists(themeDir);

        // render page

        const appData = {

            docTree: getDocTree(dirDocumentation, config.docs),
            home: config.home,

            title: config.title,
            downloadEnabled: config.downloadEnabled,
            anchorSeparator: anchorSeparator,
            autoExpandSubmenus: config.autoExpandSubmenus,

            css: csso.minify(sass.compile(path.join(themeDir, 'stylesheets', 'docs.scss')).css).css,
            fontClass: 'fontSize-' + config.theme.fontSize,
            themeVariantClass: 'themeVariant-' + config.theme.variant,

        };

        renderPage(path.join(themeDir, 'ejs', 'docs.ejs'), path.join(dirBuild, 'index.html'), appData);

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
function getDocTree(dir, docStructure) {

    let tree = [];

    for (let item of docStructure) {

        if (item.folder == 'root') {

            const files = getFiles(dir, item.folder, item.files);
            tree.push(...files);

        } else {

            const dirFolder = path.join(dir, item.folder);
            utils.checkPathExists(dirFolder, `Can't find a folder called "${item.folder}" in directory "${dir}". Please create this folder or remove it from your config.json.`);
            
            tree.push({
                type: 'folder',
                header: item.folder,
                anchor: utils.escapeLinkText(item.folder),
                files: getFiles(dirFolder, item.folder, item.files)
            });

        }

    }

    return tree;

}

function getFiles(dir, folderName, fileNames) {

    let files = [];

    for (let fileName of fileNames) {

        const pathFile = path.join(dir, fileName + '.md');
        utils.checkPathExists(pathFile, `Can't find a file called "${fileName + '.md'}" in directory "${dir}". Please create this file or remove it from your config.json.`);

        const tokens = tokenizeMarkdown(pathFile);
        const header = tokens.find(t => t.type == 'heading' && t.depth == 1);

        const anchor = utils.escapeLinkText(folderName).concat(anchorSeparator, utils.escapeLinkText(header.text));
        const content = parseMarkdown(pathFile, getMarkedRenderer({ 
            fileAnchor: anchor, 
            linkIcons: config.linkIcons,
            inlineImages: config.inlineImages
        }));

        files.push({
            type: 'file',
            anchor: anchor,
            header: header.text,
            content: content
        });

    }

    return files;

} 

// ejs functions

function renderPage (sourceDir, destDir, data) {
    
    ejs.renderFile(sourceDir, data, (err, str) => {
            
        if (err != undefined) throw err;
        fs.writeFileSync(destDir, str);

    });

}

// markdown functions

function tokenizeMarkdown (srcDir) {

    let markdown = fs.readFileSync(srcDir, 'utf8');
    return marked.lexer(markdown);

}

function parseMarkdown (srcDir, renderer) {

    marked.use({ renderer: renderer });

    let fileContents = fs.readFileSync(srcDir, 'utf8');
    return marked.parse(fileContents);

}

function getMarkedRenderer(options) {

    const headingRenderer = markedRenderers.heading(
        options.linkIcons, 
        options.fileAnchor,
        anchorSeparator);

    let renderer = {
        heading: headingRenderer
    };
    
    if (options.inlineImages) { 
        const imageRenderer = markedRenderers.image(dirAssets);
        renderer.image = imageRenderer;
    }

    return renderer;
    
}

module.exports = {
    build: main
}