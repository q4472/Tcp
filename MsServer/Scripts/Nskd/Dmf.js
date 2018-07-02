function Dmf(dmfDiv) {
    var dmfTable = document.getElementById('p_dmf_table'); // table

    var searchHeader = dmfTable.rows[0];
    var searchSection = dmfTable.rows[1];

    var searchCondition = document.getElementById('p_search_condition'); // tbody
    var searchResult = document.getElementById('p_search_result'); // tbody

    var detailHeader = dmfTable.rows[2];
    var detailSection = dmfTable.rows[3];

    var detailControl = document.getElementById('p_detail_control'); // tbody
    var domDetailInf = document.getElementById('p_detail_inf'); // tbody


    var saveButton = document.getElementById('p_save_button');
    var addButton = document.getElementById('p_add_button');
    var delButton = document.getElementById('p_del_button');
    var templateButton = document.getElementById('p_template_button');

    var table_name = null;
    var searchResultTable = null;
    var jsDetailDataSet = null;
    var jsDetailDataTable = null;
    Nskd.Dom.empty(searchCondition);
    Nskd.Dom.empty(searchResult);
    initDetailControlTable();

    this.newDbTable = function (tableName) {
        table_name = tableName;
        Nskd.Dom.empty(searchCondition);
        Nskd.Dom.empty(searchResult);
        initDetailControlTable();
        refresh();
        return;
    };
    this.refresh = refresh;

    return;

    function fillSearchConditionTable(cols) {
        for (var ci = 0; ci < cols.length; ci++) {
            var col = cols[ci];
            var ceps = col.extendedProperties;
            if (ceps) {
                if (ceps.isFiltred == 'true') {
                    var tr = document.createElement('tr');
                    {
                        var td = document.createElement('td');
                        {
                            td.style.textAlign = 'right';
                            td.style.width = '80px';
                            td.appendChild(Nskd.Dom.create('#text', col.caption + ': '));
                        }
                        tr.appendChild(td);
                        td = document.createElement('td');
                        {
                            var input = document.createElement('input');
                            //input.onkeyup = refresh;
                            td.appendChild(input);
                        }
                        tr.appendChild(td);
                    }
                    searchCondition.appendChild(tr);
                }
            }
        }
    }

    function clearSearchResult(v, b) {
        var sColor = searchSection.style.backgroundColor;
        var trs = searchResult.getElementsByTagName('tr');
        for (var tri = 1; tri < trs.length; tri++) {
            var tr = trs[tri];
            if (v) tr.style.visibility = 'hidden';
            if (b) tr.style.backgroundColor = sColor;
        }
    }

    function showSearchResult(table) {
        searchResultTable = table;
        var cols = table.columns;
        var rows = table.rows;

        if (searchResultTable.extendedProperties) {
            if (searchResultTable.extendedProperties.totalCount) {
                var showedCount = searchResultTable.extendedProperties.showedCount;
                var filtredCount = searchResultTable.extendedProperties.filtredCount;
                var totalCount = searchResultTable.extendedProperties.totalCount;
                var caption = searchResult.parentNode.caption;
                Nskd.Dom.empty(caption);
                Nskd.Dom.create('#text', 'Результат поиска (' + showedCount + '/' + filtredCount + '/' + totalCount + ')')
                    .appendTo(caption);
            }
        }

        if (searchCondition.getElementsByTagName('tr').length == 0) {
            fillSearchConditionTable(cols);
        }

        Nskd.Dom.empty(searchResult);
        fillSearchResultTable(cols);

        // строки данных
        for (var ri = 0; ri < rows.length; ri++) {
            var row = rows[ri];
            var tr = document.createElement('tr');
            {
                if (table.primaryKey) {
                    tr.primaryKey = row[table.primaryKey[0]];
                }
                tr.onclick = function () { rowSelect(this); };
                for (var ci = 0; ci < cols.length; ci++) {
                    var col = cols[ci];
                    var td = document.createElement('td');
                    {
                        var div = document.createElement('div');
                        {
                            if (col.extendedProperties) {
                                div.style.cssText = col.extendedProperties.style;
                            }
                            Nskd.Utility.DataTable.copyValueFromTableToHtmlElement(div, table, ri, ci);
                        }
                        td.appendChild(div);
                    }
                    tr.appendChild(td);
                }
            }
            searchResult.appendChild(tr);
        }

        function fillSearchResultTable(cols) {
            // строка заголовков
            var tr = document.createElement('tr');
            tr.style.fontWeight = 'bold';
            for (var ci = 0; ci < cols.length; ci++) {
                var col = cols[ci];
                var td = document.createElement('td');
                {
                    var div = document.createElement('div');
                    {
                        if (col.extendedProperties) {
                            div.style.cssText = col.extendedProperties.style;
                        }
                        if (col.caption) {
                            var text = Nskd.Dom.create('#text', col.caption);
                            div.appendChild(text);
                        } else if (col.columnName) {
                            text = Nskd.Dom.create('#text', col.columnName);
                            div.appendChild(text);
                        }
                    }
                    td.appendChild(div);
                }
                tr.appendChild(td);
            }
            searchResult.appendChild(tr);
        }

        function rowSelect(tr) {
            clearSearchResult(false, true);
            var dColor = detailSection.style.backgroundColor;
            tr.style.backgroundColor = dColor;
            getDetailDataSet(table_name, tr.primaryKey, showDetailInf);
            return;
        }
    }

    function clearDetailInf() {
        Nskd.Dom.empty(domDetailInf);
        setControlButtonsDisabled(true, false, true, true);
    }

    function getDetailDataSet(tableName, id, done) {
        var pars = {
            'cmd': 'dmf_GetDetail',
            'table_name': tableName,
            'id': id
        };
        Nskd.Server.execute(pars, function (dataSet) {
            jsDetailDataSet = dataSet;
            jsDetailDataTable = dataSet.tables[0];
            if (done) done();
        });
    }

    function showDetailInf() {

        //alert(Nskd.Json.toString(jsDetailDataSet));

        var table = jsDetailDataSet.tables[0];
        var relations = jsDetailDataSet.relations;

        Nskd.Dom.empty(domDetailInf);

        domDetailInf.primaryKey = table.primaryKey[0];

        var cols = table.columns;
        for (var ci = 0; ci < cols.length; ci++) {
            var col = cols[ci];
            // для каждой колонки своя строка
            var tr = Nskd.Dom.create('tr');
            {
                var td = Nskd.Dom.create('td',
                    null,
                    { width: '110px', textAlign: 'right' });
                {
                    var text = (col.caption) ? col.caption : col.columnName;
                    Nskd.Dom.create('#text', text + ': ').appendTo(td);
                    tr.appendChild(td);
                }
                td = Nskd.Dom.create('td');
                {
                    // надо выбрать или input или select - зависит от relations
                    for (var i = 0; i < relations.length; i++) {
                        var relation = relations[i];
                        if ((relation.childTable == 0) && (relation.childColumn == ci)) {
                            var parentTable = jsDetailDataSet.tables[relation.parentTable];
                            if (parentTable.rows.length > 0) {
                                var select = Nskd.Dom.create('select', null, { width: '350px' }).appendTo(td);
                                {
                                    select.onchange = setUpdatedMark;
                                    var option = Nskd.Dom.create('option', { value: '' }).appendTo(select);
                                    {
                                        Nskd.Dom.create('#text', '').appendTo(option);
                                    }
                                    for (var ri = 0; ri < parentTable.rows.length; ri++) {
                                        var row = parentTable.rows[ri];
                                        var value = row[relation.parentColumn];
                                        var text = row[parentTable.extendedProperties.columnForSelection];
                                        var selectedValue = (table.rows.length > 0) ? table.rows[0][ci] : 0;
                                        var attrs = (value == selectedValue) ?
                                                { value: value, selected: 'selected' } :
                                                { value: value };
                                        option = Nskd.Dom.create('option', attrs).appendTo(select);
                                        {
                                            Nskd.Dom.create('#text', text).appendTo(option);
                                        }
                                    }
                                }
                            }
                            //break;
                        }
                    }
                    if (td.childNodes.length == 0) {
                        var input = Nskd.Dom.create('input',
                            (ci == table.primaryKey[0]) ? { disabled: 'disabled' } : null,
                            { width: '350px' });
                        {
                            if (table.rows.length > 0) {
                                Nskd.Utility.DataTable.copyValueFromTableToHtmlElement(input, table, 0, ci);
                            }
                            input.onkeyup = setUpdatedMark;
                            input.onchange = setUpdatedMark;
                            td.appendChild(input);
                        }
                    }
                    tr.appendChild(td);
                }
                td = Nskd.Dom.create('td', null, { width: '10px', textAlign: 'left' }).appendTo(tr);
                domDetailInf.appendChild(tr);
            }
        }
        setControlButtonsDisabled(true, false, false, false);
        return;

        function setUpdatedMark() {
            var tr = this.parentNode.parentNode;
            var tds = tr.getElementsByTagName('td');
            var td = document.createElement('td');
            td.appendChild(Nskd.Dom.create('#text', '*'));
            tr.replaceChild(td, tds[2]);
            setControlButtonsDisabled(false, null, null, null);
        }
    }

    function saveButton_click() {
        if (jsDetailDataTable && jsDetailDataTable.rows) {
            var trs = domDetailInf.rows; //getElementsByTagName('tr');
            var row = null;
            if (jsDetailDataTable.rows.length == 0) {
                row = [];
                jsDetailDataTable.rows.push(row);
                for (var i = 0; i < trs.length; i++) {
                    var cell = null;
                    row.push(cell);
                }
            } else {
                row = jsDetailDataTable.rows[0];
            }
            
            //var row = jsDetailDataTable.rows[0];
            for (var i = 0; i < trs.length; i++) {
                var tr = trs[i];
                var tds = tr.getElementsByTagName('td');
                var input = tds[1].getElementsByTagName('input')[0];
                if (input) {
                    Nskd.Utility.DataTable.copyValueFromHtmlElementToTable(input, jsDetailDataTable, 0, i);
                } else {
                    var select = tds[1].getElementsByTagName('select')[0];
                    Nskd.Utility.DataTable.copyValueFromHtmlElementToTable(select, jsDetailDataTable, 0, i);
                }
            }
        }
        var pars = {
            'cmd': 'dmf_Upsert',
            'table_name': table_name,
            'inf_table': jsDetailDataTable
        };
        Nskd.Server.execute(pars, refresh);
        clearSearchResult(true, true);
        clearDetailInf();
    }

    function addButton_click() {
        var trs = domDetailInf.rows; //.getElementsByTagName('tr');
        if (trs.length == 0) {
            getDetailDataSet(table_name, null, function () {
                showDetailInf();
                addButton_click_new();
            });
        }
        if (trs.length != 0) {
            addButton_click_new();
        }
        return;
        function addButton_click_new() {
            var tr0_td1 = trs[0].getElementsByTagName('td')[1];
            tr0_td1.getElementsByTagName('input')[0].value = ''; //'(new)';
            for (var tri = 0; tri < trs.length; tri++) {
                var tr = trs[tri];
                var tds = tr.getElementsByTagName('td');
                var td = document.createElement('td');
                td.appendChild(Nskd.Dom.create('#text', '*'));
                tr.replaceChild(td, tds[2]);
            }
            setControlButtonsDisabled(false, true, true, true);
        }
    }

    function delButton_click() {
        var trs = domDetailInf.getElementsByTagName('tr');
        var tr = trs[domDetailInf.primaryKey];
        var tds = tr.getElementsByTagName('td');
        var input = tds[1].getElementsByTagName('input')[0];
        var pars = {
            'cmd': 'dmf_Delete',
            'table_name': table_name,
            'id': input.value
        };
        Nskd.Server.execute(pars, refresh);
        clearSearchResult(true, true);
        clearDetailInf();
    }

    function templateButton_click() {
        var trs = domDetailInf.getElementsByTagName('tr');
        var tr = trs[domDetailInf.primaryKey];
        var tds = tr.getElementsByTagName('td');
        var input = tds[1].getElementsByTagName('input')[0];
        var pars = {
            'cmd': 'GotoFromMenu',
            'table_name': table_name,
            'id': input.value,
            'button': 'Заполнить шаблон'
        };
        Nskd.Server.gotoTheNewPage(pars);
    }

    function refresh() {
        clearSearchResult(true, true);
        clearDetailInf();
        var pars = {
            'cmd': 'dmf_GetList',
            'table_name': table_name,
            'filters': []
        };
        var trs = searchCondition.getElementsByTagName('tr');
        for (var i = 0; i < trs.length; i++) {
            var tr = trs[i];
            var td = tr.getElementsByTagName('td')[1];
            var input = td.getElementsByTagName('input')[0];
            pars.filters.push(input.value);
        }
        Nskd.Server.execute(pars, showSearchResult);
    }

    function setControlButtonsDisabled(save, add, del, template) {
        if (save != null) saveButton.disabled = save;
        if (add != null) addButton.disabled = add;
        if (del != null) delButton.disabled = del;
        if (template != null) templateButton.disabled = template;
    }

    function initDetailControlTable() {
        saveButton.onclick = saveButton_click;
        addButton.onclick = addButton_click;
        delButton.onclick = delButton_click;
        templateButton.onclick = templateButton_click;
    }
}

