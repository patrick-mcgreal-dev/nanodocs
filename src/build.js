const path = require('path');
const fs = require('fs-extra');
const resolvePkg = require('resolve-package-path');

const ejs = require('ejs');
const sass = require('sass');
const csso = require('csso');
const marked = require('marked');

const configSchema = require('./config-schema.json');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(configSchema);

const utils = require('./utils');
const markedExtensions = require('./marked-extensions');

const themes = [ 'default-docs', 'default-book' ];
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
        checkConfig();

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

            theme: {
                autoExpandSubmenus: config.theme.autoExpandSubmenus,
                docNavButtons: config.theme.docNavButtons,
                fontSizeClass: 'fontSize-' + config.theme.fontSize,
                variantClass: 'themeVariant-' + config.theme.variant,
            },

            css: csso.minify(sass.compile(path.join(themeDir, 'stylesheets', 'docs.scss')).css).css,

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

function checkConfig() {

    config.theme = config.theme ?? {};
    config.theme.name = config.theme.name ?? 'default-docs';
    config.theme.variant = config.theme.variant ?? 'mid';
    config.theme.fontSize = config.theme.fontSize ?? 'small';
    config.theme.linkIcons = config.theme.linkIcons ?? true;
    config.theme.autoExpandSubmenus = config.theme.autoExpandSubmenus ?? true;
    config.theme.docNavButtons = config.theme.docNavButtons ?? false;

    config.downloadEnabled = config.downloadEnabled ?? true;
    config.inlineImages = config.inlineImages ?? true;

    const valid = validate(config);

    if (!valid) {

        let errorMessage = 'invalid config.json file:\n\t';
        errorMessage += validate.errors.map(e => e.instancePath + ' ' + e.message).join('\n\t');

        throw new Error(errorMessage);

    }

    config.home = config.home ?? config.docs[0].folder + anchorSeparator + config.docs[0].files[0];

}

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

    let unparsedFiles = [];

    for (let fileName of fileNames) {

        const pathFile = path.join(dir, fileName + '.md');
        utils.checkPathExists(pathFile, `Can't find a file called "${fileName + '.md'}" in directory "${dir}". Please create this file or remove it from your config.json.`);

        const anchor = utils.escapeLinkText(folderName).concat(anchorSeparator, utils.escapeLinkText(fileName));
        
        const markedRenderers = getMarkedRenderers({ 
            fileAnchor: anchor, 
            linkIcons: config.theme.linkIcons,
            inlineImages: config.inlineImages
        });

        unparsedFiles.push({
            path: pathFile,
            header: fileName,
            renderers: markedRenderers,
            anchor: anchor
        });

    }

    let parsedFiles = [];

    for (let i = 0; i < unparsedFiles.length; i++) {

        const file = unparsedFiles[i];

        let extensions = [
            markedExtensions.next(unparsedFiles[i + 1]?.anchor),
            markedExtensions.previous(unparsedFiles[i - 1]?.anchor)
        ];

        const content = parseMarkdown(file.path, file.renderers, extensions);

        parsedFiles.push({
            type: 'file',
            anchor: file.anchor,
            header: file.header,
            content: content
        });

    }

    return parsedFiles;

} 

// ejs functions

function renderPage (sourceDir, destDir, data) {
    
    ejs.renderFile(sourceDir, data, (err, str) => {
            
        if (err != undefined) throw err;
        fs.writeFileSync(destDir, str);

    });

}

// markdown functions

function parseMarkdown(srcDir, renderer, extensions) {

    const fileContents = fs.readFileSync(srcDir, 'utf8');

    marked.use({ renderer: renderer, extensions: [...extensions] });
    return marked.parse(fileContents);

}

function getMarkedRenderers(options) {

    const headingRenderer = markedExtensions.heading(
        options.linkIcons, 
        options.fileAnchor,
        anchorSeparator);

    let renderer = {
        heading: headingRenderer
    };
    
    if (options.inlineImages) { 
        const imageRenderer = markedExtensions.image(dirAssets);
        renderer.image = imageRenderer;
    }

    return renderer;
    
}

module.exports = {
    build: main
}