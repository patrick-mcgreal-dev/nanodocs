const path = require('path');
const fs = require('fs-extra');

const utils = require('./utils');

function heading (linkIcons, fileAnchor, anchorSeparator) {

    return (text, level) => {

        let html = '';

        if (level == 1) {

            let linkIcon = '';

            if (linkIcons) {
                linkIcon = `<a href="#${fileAnchor}" class="markdown-linkIcon"></a>`
            }

            html = `<h${level} name="${fileAnchor}">${text}${linkIcon}</h${level}>`;

        } else if (level == 2) {

            let headerAnchor = utils.escapeLinkText(text);

            if (fileAnchor) {
                headerAnchor = fileAnchor.concat(anchorSeparator, headerAnchor);
            }

            let linkIcon = '';

            if (linkIcons) {
                linkIcon = `<a href="#${headerAnchor}" class="markdown-linkIcon"></a>`
            }

            html = `<h${level} name="${headerAnchor}">${text}${linkIcon}</h${level}>`;

        } else {

            html = `<h${level}>${text}</h${level}>`;

        }

        return html;

    }

}

function image(dirAssets) {

    return (href, title, alt) => {

        const dir = path.join(dirAssets, ...href.split('/'));
        utils.checkPathExists(dir);

        const image = fs.readFileSync(dir, { encoding: 'base64' });
        const html = `<img src="data:image;base64, ${image}" title="${alt}">`;

        return html;

    }

}

module.exports = {
    heading,
    image
}