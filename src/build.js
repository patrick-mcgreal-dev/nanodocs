const path = require('path');
const fs = require('fs-extra');
const resolvePkg = require('resolve-package-path');

const ejs = require('ejs');
const sass = require('sass');
const csso = require('csso');
const marked = require('marked');

const themes = [ 'default' ];
const anchorSeparator = '+';

function main() {

    try {

        // get user directories

        const dirWorking = process.cwd();
        const dirModule = path.join(resolvePkg('nanodocs', dirWorking), '../');

        // get/check nanodocs directories

        const dirNanodocs = path.join(dirWorking, 'nanodocs');
        checkDirExists(dirNanodocs);

        const dirDocumentation = path.join(dirNanodocs, 'documentation');
        checkDirExists(dirDocumentation);

        const dirBuild = path.join(dirNanodocs, 'build');
        checkDirExists(dirBuild);

        // get config

        const config = require(path.join(dirWorking, 'nanodocs', 'config.json'));

        // get/check theme directory

        const customTheme = themes.indexOf(config.theme.name) == -1;
        const themeDir = customTheme 
            ? path.join(dirWorking, 'themes', config.theme.name)
            : path.join(dirModule, 'themes', config.theme.name);

        checkDirExists(themeDir);

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
            checkDirExists(dirFolder, `Can't find a folder called "${item.folder}" in directory "${dir}". Please create this folder or remove it from your config.json.`);

            tree.push({
                type: 'folder',
                header: escapeLinkText(item.folder),
                files: getDocTree(dirFolder, item.files, item.folder)
            });

        } else {

            const pathFile = path.join(dir, item + '.md');
            checkDirExists(pathFile, `Can't find a file called "${item + '.md'}" in directory "${dir}". Please create this file or remove it from your config.json.`);

            folderName = folderName ?? 'root';
            const tokens = tokenizeMarkdown(pathFile);
            const header = tokens.find(t => t.type == 'heading' && t.depth == 1);

            const anchor = escapeLinkText(folderName).concat(anchorSeparator, escapeLinkText(header.text));
            const content = parseMarkdown(pathFile, getMarkedRenderer(anchor));

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

    let markdown = fs.readFileSync(srcDir, 'utf8');
    return marked.parse(markdown);

}

function getMarkedRenderer(fileAnchor) {

    return {
        heading(text, level) {
            if (level == 1) {
                return `<h${level} name="${fileAnchor}">${text}</h${level}>`;
            } else {
                let headerAnchor = fileAnchor ? fileAnchor.concat(anchorSeparator, escapeLinkText(text)) : escapeLinkText(text);
                return `<h${level} name="${headerAnchor}">${text}</h${level}>`;
            }
        }   
    }
    
}

// util functions

function checkDirExists (dir) {

    if (!fs.existsSync(dir)) {
        throw new Error(`directory "${dir}" does not exist`);
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