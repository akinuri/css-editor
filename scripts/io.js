function parseCSS() {
    CSS = {};
    $sectionList.html("");
    var cssText = myCodeMirror.getValue();
    var sections = cssText.matches(/\/\* =* ((?!SECTION END).*?) =* \*\/(.*?)\/\* =* SECTION END =* \*\//gs);
    var items = [];
    sections.forEach(function (section) {
        var header = section.groups[0];
        var cssText = section.groups[1].trim();
        if (header.includes(">")) {
            var parts = header.split(">");
            var parent = parts[0].trim();
            var child  = parts[1].trim();
            if (!CSS[parent]) {
                CSS[parent] = {};
            }
            CSS[parent][child] = cssText;
            var childPushed = false;
            for (var i = 0; i < items.length; i++) {
                if (items[i] instanceof Array && items[i].includes(parent) && parent != child) {
                    items[i].push(child);
                    childPushed = true;
                    break;
                }
            }
            if (!childPushed && parent != child) {
                items.push([parent, child]);
            }
        } else {
            CSS[header] = cssText;
            items.push(header);
        }
    });
    items.forEach(function (item) {
        if (item instanceof Array) {
            var parent = item.shift();
            $sectionList.append( elem("li", null, parent) );
            item.forEach(function (subitem) {
                $sectionList.append( elem("li", {"class":"depth-1"}, subitem) );
            });
        } else {
            $sectionList.append( elem("li", null, item) );
        }
    });
    $code.html("");
    myCodeMirror.setValue("");
}


function EOL(n) {
    n = n || 1;
    return "\r\n".repeat(n);
}

function sectionSeperator(section, parent) {
    if (parent) {
        return "/* ==================== " + parent + " > " + section + " ==================== */";
    }
    return "/* ==================== " + section + " ==================== */";
}

var sectionSeperatorEnd = "/* ========== SECTION END ========== */";

Array.prototype.move2begin = function (item) {
    this.splice(0, 0, this.splice(this.indexOf(item), 1)[0]);
};

Array.prototype.move2end = function (item) {
    this.splice(this.length - 1, 0, this.splice(this.indexOf(item), 1)[0]);
};

function serializeSectionList() {
    var sections = [];
    $sectionList.find("li").each(function () {
        var parentItem = getParentItem(this);
        if (parentItem) {
            // subitem
            for (var i = 0; i < sections.length; i++) {
                if (sections[i] instanceof Array && sections[i][0] == parentItem.innerText) {
                    sections[i].push(this.innerText);
                }
            }
        } else {
            if (subItems = getSubItems(this)) {
                // parent-item
                sections.push([this.innerText]);
            } else {
                // item
                sections.push(this.innerText);
            }
        }
    });
    for (var i = 0; i < sections.length; i++) {
        if (sections[i] instanceof Array) {
            if (sections[i].includes("RESET")) {
                sections[i].move2begin("RESET");
            }
            if (sections[i].includes("RESPONSIVE")) {
                sections[i].move2end("RESPONSIVE");
            }
        }
    }
    return sections;
}

function copyCSS() {
    var cssText = [];
    var sections = serializeSectionList();
    sections.forEach(function (section) {
        if (section instanceof Array) {
            var parent = null;
            if (section[0] == "RESET") {
                parent = section[1];
            } else {
                parent = section[0];
            }
            section.forEach(function (name) {
                if (CSS[parent][name] != "") {
                    cssText.push( sectionSeperator(name, parent) + EOL(2) + CSS[parent][name] + EOL(2) + sectionSeperatorEnd );
                }
            });
        } else {
            cssText.push( sectionSeperator(section) + EOL(2) + CSS[section] + EOL(2) + sectionSeperatorEnd );
        }
    });
    cssText = cssText.join( EOL(5) );
    copy2clipboard(cssText);
}

function copy2clipboard(text) {
    var textarea = elem("textarea", {"style":"position: absolute; top: 0; opacity: 0;"}, text);
    document.body.appendChild(textarea);
    textarea.select();
    try {
        var successful = document.execCommand("copy");
        textarea.remove();
    } catch (err) {
        console.warn('Oops, unable to copy.');
    }
}
