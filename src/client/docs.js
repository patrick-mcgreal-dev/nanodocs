const title = '<%= title %>';
const anchorSeparator = '<%= anchorSeparator %>';
let fontClass = '<%= fontClass %>';

let lastDocAnchor = '';
let lastFolderAnchor = '';
let currentFontSize = 100;

const icons = {
    more: 'assets/images/expand_more_black_24dp.svg',
    less: 'assets/images/expand_less_black_24dp.svg',
    menu: 'assets/images/menu_book_black_24dp.svg',
    close: 'assets/images/close_black_24dp.svg',
}

const themes = ['light', 'mid', 'dark'];

themeInit();
switchDoc(location.hash);

window.onhashchange = () => {
    switchDoc(location.hash);
}

function switchDoc(path) {

    if (!path) {
        window.location.hash = document.getElementsByClassName('markdown')[0].id;
        return;
    }

    path = path.replace(/\#/g, '');

    let anchors = path.split(anchorSeparator);
    let folderAnchor = anchors[0];
    let fileAnchor = anchors[1];
    let docAnchor = folderAnchor.concat(anchorSeparator, fileAnchor);
    let headerAnchor = anchors.length == 3 ? anchors[2] : null;

    if (lastDocAnchor) {
        closeElement(document.getElementById(lastDocAnchor));
        closeElement(document.getElementById('navItemContainer_' + lastDocAnchor));
    }

    let doc = document.getElementById(docAnchor)
    openElement(doc);
    openElement(document.getElementById('navItemContainer_' + docAnchor));

    if (headerAnchor) {
        document.getElementsByName(path)[0].scrollIntoView();
    } else {
        doc.parentElement.scrollTop = 0;
    }

    if (folderAnchor != 'root') {
        openSubMenu(folderAnchor);
    }

    lastFolderAnchor = folderAnchor;
    lastDocAnchor = docAnchor;
}

function toggleMenu() {

    toggleElement(document.querySelector('.nav-menu'));
    toggleElement(document.getElementById('navExpandIcon'));
    toggleElement(document.getElementById('navCollapseIcon'));

}

function toggleSubMenu(folderHeader) {

    toggleElement(document.getElementById('subMenu_' + folderHeader));
    toggleElement(document.getElementById('subMenuExpandIcon_' + folderHeader));
    toggleElement(document.getElementById('subMenuCollapseIcon_' + folderHeader));

}

function openSubMenu(folderHeader) {

    const submenu = document.getElementById('subMenu_' + folderHeader);

    if (!submenu.classList.contains('open'))
        toggleSubMenu(folderHeader);

}

function closeSubMenu(folderHeader) {

    const submenu = document.getElementById('subMenu_' + folderHeader);

    if (submenu.classList.contains('open'))
        toggleSubMenu(folderHeader);

}

function toggleElement(element) {
    element.classList.toggle('open');
}

function openElement(element) {
    element.classList.add('open');
}

function closeElement(element) {
    element.classList.remove('open');
}

function themeInit() {

    // theme menu

    document.onclick = (e) => {
        closeElement(document.getElementById('markdown-menu'));
    };

    document.getElementById('markdown-menuButton').onclick = (e) => {
        e.cancelBubble = true;
        toggleElement(document.getElementById('markdown-menu'));
    };

    document.getElementById('markdown-menu').onclick = (e) => {
        e.cancelBubble = true;
    };

    // font sizing

    let rules = document.styleSheets[0].cssRules;

    for (let rule of rules) {
        if (!rule.selectorText.includes(fontClass)) {
            continue;
        }
        currentFontSize = parseInt(rule.style.fontSize.replace('%', ''));
        break;
    }
}

function themeFontResize(inc) {
    if (inc > 0 && currentFontSize >= 150) return;
    if (inc < 0 && currentFontSize <= 50) return;
    currentFontSize += inc;
    document.documentElement.style.fontSize = currentFontSize.toString() + '%';
}

function themeChange(name) {

    let container = document.getElementById('container');

    for (let theme of themes) {
        container.classList.remove('themeVariant-' + theme);
    }

    container.classList.add('themeVariant-' + name);

}

function download() {

    if (lastDocAnchor) {
        closeElement(document.getElementById(lastDocAnchor));
        closeElement(document.getElementById('navItemContainer_' + lastDocAnchor));
    }

    if (lastFolderAnchor != 'root')
        closeSubMenu(lastFolderAnchor);

    const page = document.documentElement.outerHTML.toString();

    if (lastDocAnchor) {
        openElement(document.getElementById(lastDocAnchor));
        openElement(document.getElementById('navItemContainer_' + lastDocAnchor));
    }

    if (lastFolderAnchor != 'root')
        openSubMenu(lastFolderAnchor);

    const blob = new Blob([page], { type: 'text/html' });
    saveAs(blob, title);
    
}