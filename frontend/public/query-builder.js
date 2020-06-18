/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = {};
    let forms = document.forms;
    let formElement;
    let datasetID = "";

    let coursesTab = document.getElementById("tab-courses").className;
    if (coursesTab === "tab-panel active") {
        datasetID = "courses";
        formElement = forms[1];
    } else {
        datasetID = "rooms";
        formElement = forms[2];
    }

    let condFilter = "";
    let conditionsFilter = document.getElementsByClassName("control-group condition-type");
    if (datasetID === "courses") {
        conditionsFilter = conditionsFilter[0].childNodes;
    } else {
        conditionsFilter = conditionsFilter[1].childNodes;
    }
    let topLevelNot = false;
    for (let cond of conditionsFilter) {
            if (cond.nodeName==="DIV" && cond.childNodes[1].checked) {
                let type = cond.childNodes[1].getAttribute("value");
                if (type === "all") {
                    condFilter = "AND";
                } else if (type === "any") {
                    condFilter = "OR";
                } else if (type === "none") {
                    condFilter = "OR";
                    topLevelNot = true;
                }
            }
    }

    let conditions = formElement.childNodes[1];
    let conditionsContainer = conditions.childNodes[5].childNodes;

    let condArray = [];
    for (let condition of conditionsContainer) {
        let notFlag = false;
        let opField = "";
        let operator = "";
        let term = "";

        let elements = condition.children;
        let not = elements[0].children[0];
        if (not.checked) {
            notFlag = true;
        }

        let controlFields = elements[1].childNodes[1].children;
        for (let f of controlFields) {
            if (f.selected) {
                opField = datasetID+"_"+f.value;
                break;
            }
        }

        let operators = elements[2].childNodes[1].children;
        for (let op of operators) {
            if (op.selected) {
                operator = op.value;
                break;
            }
        }

        term = elements[3].childNodes[1].value;
        if ((operator !== "IS") && (!isNaN(Number.parseFloat(term)))) {
            term = Number.parseFloat(term);
        }

        let insideObj = {};
        insideObj[opField] = term;

        let condObj = {};
        condObj[operator] = insideObj;

        if (notFlag) {
            let finalObj = {};
            finalObj.NOT = condObj;
            if (conditionsContainer.length === 1) {
                condArray = finalObj;
            } else {
                condArray.push(finalObj);
            }
        } else {
            if (conditionsContainer.length === 1) {
                condArray = condObj;
            } else {
                condArray.push(condObj);
            }
        }
    }

    if (conditionsContainer.length > 1) {
        let topObj = {};
        topObj[condFilter] = condArray;

        if (topLevelNot) {
            let notTopObj = {};
            notTopObj.NOT = topObj;
            query.WHERE = notTopObj;
        } else {
            query.WHERE = topObj;
        }
    } else if (conditionsContainer.length === 1) {
        if (topLevelNot) {
            let notTopObj = {};
            notTopObj.NOT = condArray;
            query.WHERE = notTopObj;
        } else {
            query.WHERE = condArray;
        }
    } else {
        query.WHERE = {};
    }

    // COLUMNS
    let columns = formElement.children[1].children[1].children;
    let selectedColumns = [];
    for (let column of columns) {
        if (column.children[0].checked) {
            if (column.className === "control field") {
                selectedColumns.push(datasetID + "_" + column.children[0].value);
            } else {
                selectedColumns.push(column.children[0].value);
            }
        }
    }

    // ORDER (and dir)
    let selectedOrderColumns = [];
    let orderColumns = formElement.children[2].children[1].children[0].childNodes[1].children;
    let dir = formElement.children[2].children[1].children[1];

    for (let column of orderColumns) {
        if (column.selected) {
            if (column.className === "transformation") {
                selectedOrderColumns.push(column.value)
            } else {
                selectedOrderColumns.push(datasetID+"_"+column.value);
            }
        }
    }

    let dirNode = dir.children[0];
    let direction = "UP";
    if (dirNode.checked) {
        direction = "DOWN"
    }

    let orderObj = {};
    orderObj.dir = direction;
    orderObj.keys = selectedOrderColumns;

    let optionsObj = {};
    optionsObj.COLUMNS = selectedColumns;
    if (selectedOrderColumns.length > 0 || direction === "DOWN") {
        optionsObj.ORDER = orderObj;
    }
    query.OPTIONS = optionsObj;

    // GROUPS
    let groups = formElement.children[3].children[1].children;
    let checkedGroups = [];
    for (let group of groups) {
        if (group.children[0].checked) {
            checkedGroups.push(datasetID+"_"+group.children[0].value);
        }
    }

    // TRANSFORMATIONS
    let transformations = formElement.children[4].children[1].children;
    let applyArray = [];
    for (let trans of transformations) {
        let term = trans.children[0].childNodes[1].value;

        let selectedOperator = "";
        let operators = trans.children[1].children[0].children;
        for (let op of operators) {
            if (op.selected) {
                selectedOperator = op.value;
                break;
            }
        }

        let selectedField = "";
        let fields = trans.children[2].children[0].children;
        for (let f of fields) {
            if (f.selected) {
                selectedField = f.value;
                break;
            }
        }
        let innerTObj = {};
        innerTObj[selectedOperator] = datasetID+"_"+selectedField;
        let outerTObj = {};
        outerTObj[term] = innerTObj;
        applyArray.push(outerTObj);
    }

    if (checkedGroups.length>0 || applyArray.length>0) {
        let transObject = {};
        transObject.GROUP = checkedGroups;
        transObject.APPLY = applyArray;
        query.TRANSFORMATIONS = transObject;
    }
    return query;
};
