
Nskd = window.Nskd || {};

Nskd.Menu = function (domMenu, jsoMenu, selectedNodePath) {

    // private fields and constructor
    var selectedNode = null;

    // всё очистить
    Nskd.Dom.empty(domMenu);

    // рисуем меню (рекурсивно), если найдётся selectedNodePath, то будет заполнен selectedNode
    addDomNode(domMenu, jsoMenu, ''); //[' + jsoMenu.name + ']

    // пункт меню выбираем сразу
    if (selectedNode) {
        getDomHead(selectedNode).onclick();
    }

    // добавляем кнопку перехода
    var div = document.createElement('div');
    {
        div.style.marginTop = '20px';
        div.style.padding = '2px';
        div.style.backgroundColor = '#ccffcc';
        div.style.textAlign = "right";
        div.onclick = function () { Nskd.Server.gotoTheNewPage({ cmd: 'GotoFromMenu' }); };
        var span = document.createElement('span');
        {
            span.style.fontWeight = 'bold';
            var text = Nskd.Dom.create('#text', '------>>>');
            span.appendChild(text);
        }
        div.appendChild(span);
    }
    domMenu.appendChild(div);

    return;

    // private functions

    function addDomNode(domCont, jsoNode, nodePath) {
        var domNode = document.createElement('div');
        if ((nodePath == '') || (nodePath == '.' + selectedNodePath)) {
            selectedNode = domNode;
            //alert(selectedNodePath + ' == ' + nodePath);
        }
        domNode.className = 'nskdMenuNode ';
        domCont.appendChild(domNode);
        {
            addDomNodeHead(domNode, jsoNode, nodePath);
            addDomNodeCont(domNode, jsoNode, nodePath);
        }
        //return domNode;
    }

    function addDomNodeHead(domNode, jsoNode, nodePath) {
        var domHead = document.createElement('div');
        domHead.className = 'nskdMenuNodeHead ';
        domHead.onclick = menuNodeHeadOnclick;
        {
            addDomNodeHeadMark(domHead, jsoNode);
            addDomNodeHeadName(domHead, jsoNode);
        }
        domNode.appendChild(domHead);
    }

    function menuNodeHeadOnclick() {
        var domNode = this.parentNode;
        resetDomNodes();
        selectedNodePath = selectDomNode(domNode);
        // регистрируем выбор в параметрах среды
        Nskd.Client.EnvVars.selectedMenuNodePath = selectedNodePath;
    };

    function addDomNodeHeadMark(domHead, jsoNode) {
        var domMark = document.createElement('div');
        domMark.className = (jsoNode.cont.length > 0) ?
            'nskdMenuNodeHeadMark nskdMenuNodeHeadMark_plus' :
            'nskdMenuNodeHeadMark nskdMenuNodeHeadMark_leaf';
        domHead.appendChild(domMark);
    }

    function addDomNodeHeadName(domHead, jsoNode) {
        var domName = document.createElement('div');
        domName.className = 'nskdMenuNodeHeadName ';
        {
            var domNameSpan = document.createElement('span');
            {
                var text = Nskd.Dom.create('#text', jsoNode.name);
                domNameSpan.appendChild(text);
            }
            domName.appendChild(domNameSpan);
        }
        domHead.appendChild(domName);
    }

    function addDomNodeCont(domNode, jsoNode, nodePath) {
        var domCont = document.createElement('div');
        domCont.className = 'nskdMenuNodeCont ';
        for (var i = 0; i < jsoNode.cont.length; i++) {
            var node = jsoNode.cont[i];
            addDomNode(domCont, node, nodePath + '.[' + node.name + ']');
        }
        domNode.appendChild(domCont);
    }

    function resetDomNodes() {
        var divs = domMenu.getElementsByTagName('div');
        for (var i = 0; i < divs.length; i++) {
            var div = divs[i];
            if (div.className.indexOf('nskdMenuNode ') >= 0) {
                var head = getDomHead(div);
                head.style.backgroundColor = 'transparent';
                var cont = getDomCont(div);
                cont.style.paddingLeft = '0px';
                hide(div);
            }
        }
    }

    function selectDomNode(domNode) {
        var head = getDomHead(domNode);
        head.style.backgroundColor = '#ffff88';
        var selectedNodePath = showParentDomNodeChain(domNode);
        //showSiblingDomNodes(domNode);
        showChildDomNodes(domNode);
        return selectedNodePath;
    };

    function showParentDomNodeChain(domNode) {
        var selectedNodePath = '';
        var node = domNode;
        while (node) {
            var segment = node.firstChild.childNodes[1].firstChild.firstChild.nodeValue;
            selectedNodePath = '[' + segment + '].' + selectedNodePath;
            var cont = getDomCont(node);
            cont.style.paddingLeft = '0px';
            show(node);
            node = getParentDomNode(node);
        }
        selectedNodePath = selectedNodePath.substring(0, (selectedNodePath.length - 1));
        return selectedNodePath;
    }

    function showSiblingDomNodes(domNode) {
        var node = getParentDomNode(domNode);
        if (node) {
            showChildDomNodes(node);
        }
    }

    function showChildDomNodes(domNode) {
        var cont = getDomCont(domNode);
        cont.style.paddingLeft = '8px';
        var nodes = cont.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            show(nodes[i]);
        }
    }

    function show(domNode) { domNode.style.display = 'block'; }

    function hide(domNode) { domNode.style.display = 'none'; }

    function getDomHead(domNode) { return domNode.childNodes[0]; }

    function getDomCont(domNode) { return domNode.childNodes[1]; }

    function getParentDomNode(domNode) {
        p = domNode.parentNode.parentNode;
        return ((p.className.indexOf('nskdMenuNode ') >= 0) ? p : null);
    }
};
