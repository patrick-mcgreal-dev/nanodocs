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

        if (fs.lstatSync(dir).isDirectory()) {
            throw new Error(`can't load an image at the following path: ${dir}`);
        }

        const image = fs.readFileSync(dir, { encoding: 'base64' });
        const html = `<img src="data:image;base64, ${image}" title="${alt}">`;

        return html;

    }

}

function next(nextAnchor) {

    return {

        name: 'next',
        level: 'block',
    
        tokenizer(src, tokens) {
    
            const rule = /^(>{2})(?= )(.*)/;
            const match = rule.exec(src);
    
            if (match) {
                return {
                    type: 'next',
                    raw: match[0],
                    text: match[2].trim()
                };
            }
            
        },
    
        renderer(token) {
            return `<a href="#${nextAnchor}">${token.text}</a>`;
        }

    };

}

function previous(previousAnchor) {

    return {

        name: 'previous',
        level: 'block',
    
        tokenizer(src, tokens) {
    
            const rule = /^(<{2})(?= )(.*)/;
            const match = rule.exec(src);
    
            if (match) {
                return {
                    type: 'previous',
                    raw: match[0],
                    text: match[2].trim()
                };
            }
            
        },
    
        renderer(token) {
            return `<a href="#${previousAnchor}">${token.text}</a>`;
        }

    };

}

module.exports = {
    heading,
    image,
    next,
    previous
}