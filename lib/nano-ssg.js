const fs = require('fs');

const ejs = require('ejs');
const sass = require('sass');
const marked = require('marked');

// prevent marked from adding id elements to headers
// see here: https://github.com/treasonx/grunt-markdown/issues/54
const r = new marked.Renderer();
r.heading = (text, level) => { 
    return `<h${level}>${text}</h${level}>\n`;
};

marked.use({ r });

module.exports = {

    checkDirExists: (dir, errorMessage) => {

        if (!fs.existsSync(dir)) {
            throw new Error(errorMessage || `directory "${dir}" does not exist`);
        }
    
    },

    tokenizeMarkdown: (srcDir) => {

        let markdown = fs.readFileSync(srcDir, 'utf8');
        return marked.lexer(markdown);

    },
    
    parseMarkdown: (srcDir, renderer) => {

        if (renderer) {
            marked.use({ renderer });
        }
    
        let markdown = fs.readFileSync(srcDir, 'utf8');
        return marked.parse(markdown);
    
    },
    
    renderPage: (sourceDir, destDir, data) => {
    
        ejs.renderFile(sourceDir, data, (err, str) => {
                
            if (err != undefined) throw err;
    
            fs.writeFile(destDir, str, (err) => {
    
                if (err != undefined) throw err;
    
            });
    
        });
    
    },
    
    renderStyle: (sourceDir, destDir) => {
    
        sass.render({ file: sourceDir }, (err, result) => {
    
            if (err != undefined) throw err;
    
            fs.writeFile(destDir, result.css.toString(), (err) => {
    
                if (err != undefined) throw err;
    
            });
    
        });
    
    },

};