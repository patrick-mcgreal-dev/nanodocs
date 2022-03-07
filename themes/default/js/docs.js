const title = '<%= title %>';
const anchorSeparator = '<%= anchorSeparator %>';
const fontClass = '<%= fontClass %>';

const themeVariants = ['light', 'mid', 'dark'];

let currentFontSize = 100;

let lastDocAnchor = '';
let lastFolderAnchor = '';

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

    const anchors = path.split(anchorSeparator);
    const folderAnchor = anchors[0];
    const fileAnchor = anchors[1];
    const docAnchor = folderAnchor.concat(anchorSeparator, fileAnchor);
    const headerAnchor = anchors.length == 3 ? anchors[2] : null;

    if (lastDocAnchor) {
        closeElement(document.getElementById(lastDocAnchor));
        closeElement(document.getElementById('navItemContainer_' + lastDocAnchor));
    }

    const doc = document.getElementById(docAnchor)
    openElement(doc);
    openElement(document.getElementById('navItemContainer_' + docAnchor));

    if (headerAnchor) {
        document.getElementsByName(path)[0].scrollIntoView();
    } else {
        doc.parentElement.scrollTop = 0;
    }

    lastFolderAnchor = folderAnchor;
    lastDocAnchor = docAnchor;

    if (folderAnchor != 'root') {
        openSubMenu(folderAnchor);
    }

    if (window.matchMedia('(max-width: 940px)').matches) {
        closeMenu();
    }
}

function toggleMenu() {

    toggleElement(document.querySelector('.nav-menu'));
    toggleElement(document.getElementById('navExpandIcon'));
    toggleElement(document.getElementById('navCollapseIcon'));

}

function openMenu() {

    const menu = document.querySelector('.nav-menu');

    if (!menu.classList.contains('open'))
        toggleMenu();
    
}

function closeMenu() {

    const menu = document.querySelector('.nav-menu');

    if (menu.classList.contains('open'))
        toggleMenu();

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

    if (document.styleSheets[0]) {

        const rules = document.styleSheets[0].cssRules;

        for (let rule of rules) {
            if (!rule.selectorText.includes(fontClass)) {
                continue;
            }
            currentFontSize = parseInt(rule.style.fontSize.replace('%', ''));
            break;
        }

    }

    // header link icons

    const linkLocations = document.querySelectorAll('.markdown-linkIcon');
    const linkIcon = document.getElementById('linkIcon');

    for (let location of linkLocations) {
        location.innerHTML = linkIcon.innerHTML;
    }
}

function themeFontResize(inc) {
    if (inc > 0 && currentFontSize >= 150) return;
    if (inc < 0 && currentFontSize <= 50) return;
    currentFontSize += inc;
    document.documentElement.style.fontSize = currentFontSize.toString() + '%';
}

function themeChange(name) {

    const container = document.getElementById('container');

    for (let theme of themeVariants) {
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

    closeElement(document.getElementById('markdown-menu'));

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