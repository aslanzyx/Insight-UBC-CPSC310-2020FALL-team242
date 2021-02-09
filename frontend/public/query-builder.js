/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = () => {
    let query = {};
    // TODO: implement!
    let tab = document.getElementsByClassName(ACTIVE_TAB)[0];
    let id = tab.id.split("-")[1];
    query["WHERE"] = buildWHERE(id, tab);
    query["OPTIONS"] = {};
    query["OPTIONS"]["COLUMNS"] = buildCOLUMNS(id, tab);
    let order = buildORDER(id, tab);
    if (order !== null) {
        query["OPTIONS"]["ORDER"] = order;
    }

    let groups = buildGROUPS(id, tab);
    let apply = buildAPPLY(id, tab);
    if (groups.length !== 0 || apply.length !== 0) {
        query["TRANSFORMATIONS"] = {
            "GROUP": groups,
            "APPLY": apply
        }
    }
    return query;
};

function buildWHERE(id, tab) {
    var cond = {};
    var filters;
    CONDITION_TYPES.forEach((type) => {
        if (document.getElementById(id.concat("-conditiontype-").concat(type)).checked) {
            switch (type) {
                case CONDITION_TYPES[0]:
                    cond["AND"] = [];
                    filters = cond["AND"];
                    break;
                case CONDITION_TYPES[1]:
                    cond["OR"] = [];
                    filters = cond["OR"];
                    break;
                case CONDITION_TYPES[2]:
                    cond["NOT"] = {};
                    cond["NOT"]["OR"] = [];
                    filters = cond["NOT"]["OR"];
                    break;
                default:
                    break;
            }
        }
    })
    let conditions = tab.getElementsByClassName("control-group condition");
    resolveConditions(conditions, filters, id);
    if (filters.length === 0) {
        return {};
    }
    if (filters.length === 1) {
        return filters[0];
    }

    return cond;
}

const SFIELDS = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname",
    "number", "name", "address", "type", "furniture", "href"];
const CFIELDS = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];

function resolveConditions(conditions, filters, id) {
    for (let i = 0; i < conditions.length; i++) {
        const cond = conditions[i];
        let not = cond.getElementsByClassName("control ".concat(COND_CONTAINER_CLASSES[0]))[0].children[0].checked;
        let field = getSelection(
            cond.getElementsByClassName("control ".concat(COND_CONTAINER_CLASSES[1]))[0].children[0].children);
        let operator = getSelection(
            cond.getElementsByClassName("control ".concat(COND_CONTAINER_CLASSES[2]))[0].children[0].children);
        let term = cond.getElementsByClassName("control ".concat(COND_CONTAINER_CLASSES[3]))[0].children[0].value;
        let statement = {};
        if (SFIELDS.includes(field)) {
            statement[id.concat("_").concat(field)] = term;
        } else {
            statement[id.concat("_").concat(field)] = Number(term);
        }
        let logic = {};
        logic[operator] = statement;
        if (not) {
            filters.push({ "NOT": logic });
        } else {
            filters.push(logic);
        }
    }
}

function getSelection(selections) {
    return getMultipleSelections(selections)[0];
}

function getMultipleSelections(selections) {
    let retval = [];
    for (let i = 0; i < selections.length; i++) {
        const s = selections[i];
        if (s.selected) {
            retval.push(s.value);
        }
    }
    return retval;
}

function buildCOLUMNS(id, tab) {
    var fieldArr;
    if (id === "courses") {
        fieldArr = COURSES_FIELDS;
    } else if (id === "rooms") {
        fieldArr = ROOMS_FIELDS;
    } else {
        return null;
    }
    columns = [];
    fieldArr.forEach((field) => {
        if (document.getElementById(id.concat("-columns-field-").concat(field)).checked) {
            columns.push(id.concat("_").concat(field));
        }
    });
    let transformations = tab.getElementsByClassName("control transformation")
    for (let i = 0; i < transformations.length; i++) {
        const e = transformations[i];
        if (e.children[0].checked) {
            columns.push(e.children[0].value);
        }
    }
    return columns;
}

function buildGROUPS(id, tab) {
    var fieldArr;
    if (id === "courses") {
        fieldArr = COURSES_FIELDS;
    } else if (id === "rooms") {
        fieldArr = ROOMS_FIELDS;
    } else {
        return null;
    }
    groups = [];
    fieldArr.forEach((field) => {
        if (document.getElementById(id.concat("-groups-field-").concat(field)).checked) {
            groups.push(id.concat("_").concat(field));
        }
    });
    return groups;
}

function buildORDER(id, tab) {
    let rawFields = getMultipleSelections(
        tab.getElementsByClassName("control order fields")[0].children[0].children);
    if (rawFields.length === 0) {
        return null;
    }
    fields = addId(id, rawFields);

    var dir;
    if (document.getElementById(id.concat("-order")).checked) {
        dir = "DOWN";
    } else {
        dir = "UP";
    }
    return {
        "dir": dir,
        "keys": fields
    }
}

function addId(id, arr) {
    newArr = []
    var fields
    if (id === "courses") {
        fields = COURSES_FIELDS
    } else {
        fields = ROOMS_FIELDS
    }
    arr.forEach((e) => {
        if (fields.includes(e)) {
            newArr.push(id.concat("_").concat(e));
        } else {
            newArr.push(e)
        }
    })
    return newArr;
}

function buildAPPLY(id, tab) {
    let containers = tab.getElementsByClassName("control-group transformation");
    let apply = [];
    for (let i = 0; i < containers.length; i++) {
        const c = containers[i];
        let term = c.getElementsByClassName("control ".concat(COND_CONTAINER_CLASSES[3]))[0].children[0].value;
        let field = getSelection(
            c.getElementsByClassName("control ".concat(COND_CONTAINER_CLASSES[1]))[0].children[0].children
        );
        let operator = getSelection(
            c.getElementsByClassName("control ".concat(COND_CONTAINER_CLASSES[2]))[0].children[0].children
        )
        field = id.concat("_").concat(field);

        let statement = {};
        statement[term] = {};
        statement[term][operator] = field;
        apply.push(statement);
    }
    return apply;
}

const COND_CONTAINER_CLASSES = [
    "not",
    "fields",
    "operators",
    "term"
]

const CONDITION_TYPES = [
    "all",
    "any",
    "none"
]
const ACTIVE_TAB = "tab-panel active";
const COURSES_FIELDS = [
    "audit",
    "avg",
    "dept",
    "fail",
    "id",
    "instructor",
    "pass",
    "title",
    "uuid",
    "year"
];
const ROOMS_FIELDS = [
    "address",
    "fullname",
    "furniture",
    "href",
    "lat",
    "lon",
    "name",
    "number",
    "seats",
    "shortname",
    "type"
]
