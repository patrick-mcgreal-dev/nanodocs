const path = require('path');
const fs = require('fs-extra');
const resolvePkg = require('resolve-package-path');

const ejs = require('ejs');
const sass = require('sass');
const csso = require('csso');
const marked = require('marked');

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
        checkPathExists(dirNanodocs);

        const dirDocumentation = path.join(dirNanodocs, 'contents', 'documentation');
        checkPathExists(dirDocumentation);

        dirAssets = path.join(dirNanodocs, 'contents', 'assets');
        checkPathExists(dirAssets);

        const dirBuild = path.join(dirNanodocs, 'build');
        checkPathExists(dirBuild);

        // get config

        config = require(path.join(dirWorking, 'nanodocs', 'config.json'));

        // get/check theme directory

        const customTheme = themes.indexOf(config.theme.name) == -1;
        const themeDir = customTheme 
            ? path.join(dirWorking, 'themes', config.theme.name)
            : path.join(dirModule, 'themes', config.theme.name);

        checkPathExists(themeDir);

        // render page

        const appData = {

            docTree: getDocTree(dirDocumentation, config.docs),

            title: config.title,
            downloadEnabled: config.downloadEnabled,
            anchorSeparator: anchorSeparator,

            css: csso.minify(sass.compile(path.join(themeDir, 'stylesheets', 'docs.scss')).css).css,
            fontClass: 'fontSize-' + config.theme.fontSize,
            themeVariantClass: 'themeVariant-' + config.theme.variant,

        };

        renderPage(path.join(themeDir, 'docs.ejs'), path.join(dirBuild, 'index.html'), appData);

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

        const isFolder = typeof item != 'string';

        if (isFolder) {

            const dirFolder = path.join(dir, item.folder);
            checkPathExists(dirFolder, `Can't find a folder called "${item.folder}" in directory "${dir}". Please create this folder or remove it from your config.json.`);

            tree.push({
                type: 'folder',
                header: escapeLinkText(item.folder),
                files: getDocTree(dirFolder, item.files, item.folder)
            });

        } else {

            const pathFile = path.join(dir, item + '.md');
            checkPathExists(pathFile, `Can't find a file called "${item + '.md'}" in directory "${dir}". Please create this file or remove it from your config.json.`);

            folderName = folderName ?? 'root';
            const tokens = tokenizeMarkdown(pathFile);
            const header = tokens.find(t => t.type == 'heading' && t.depth == 1);

            const anchor = escapeLinkText(folderName).concat(anchorSeparator, escapeLinkText(header.text));
            const content = parseMarkdown(pathFile, getMarkedRenderer({ 
                fileAnchor: anchor, 
                linkIcons: config.linkIcons,
                inlineImages: config.inlineImages
            }));

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

    marked.use({ renderer });

    let fileContents = fs.readFileSync(srcDir, 'utf8');
    return marked.parse(fileContents);

}

function getMarkedRenderer(options) {

    const customHeading = (text, level) => {

        let html = '';

        if (level == 1) {

            const linkIcon = options.linkIcons ? `<a href="#${options.fileAnchor}" class="markdown-linkIcon"></a>` : '';
            html = `<h${level} name="${options.fileAnchor}">${text}${linkIcon}</h${level}>`;

        } else if (level == 2) {

            const headerAnchor = options.fileAnchor ? options.fileAnchor.concat(anchorSeparator, escapeLinkText(text)) : escapeLinkText(text);
            const linkIcon = options.linkIcons ? `<a href="#${headerAnchor}" class="markdown-linkIcon"></a>` : '';
            html = `<h${level} name="${headerAnchor}">${text}${linkIcon}</h${level}>`;

        } else {

            html = `<h${level}>${text}</h${level}>`;

        }

        return html;

    };

    const customImage = (href, title, alt) => {

        const dir = path.join(dirAssets, ...href.split('/'));
        checkPathExists(dir);

        const image = fs.readFileSync(dir, { encoding: 'base64' });
        const html = `<img src="data:image;base64, ${image}" title="${alt}">`;

        return html;

    };

    let renderer = {
        heading: customHeading
    };
    
    if (options.inlineImages) { renderer.image = customImage; }

    return renderer;
    
}

// util functions

function checkPathExists (path) {

    if (!fs.existsSync(path)) {
        throw new Error(`directory or file "${path}" does not exist`);
    }

}

function escapeLinkText(input) {
    return input
        .toLowerCase()
        .replace(/[^\w]/g, '-') // replace spaces with dashes
        .replace(/\-$/g, ''); // remove trailing dashes at the end of the string
}

module.exports = {
    build: main
}