import * as parse5 from "parse5";

export interface Attribute {
    name: string;
    value: string;
}

export interface Parse5 {
    nodeName?: string;
    childNodes?: Parse5[];
    attributes?: Attribute[];
    [id: string]: any;
}

export class Parser {
    public static readonly nodeNameKey: string = "nodeName";
    public static readonly childNodesKey: string = "childNodes";
    public static readonly attributesKey: string = "attrs";
    public static readonly valueKey: string = "value";

    public readonly document: Parse5;

    public readonly hasNodeName: boolean = false;
    public readonly hasChildNodes: boolean = false;
    public readonly hasAttributes: boolean = false;
    public readonly hasValue: boolean = false;

    public readonly nodeName: string = null;
    public readonly childNodes: Parse5[] = null;
    public readonly attributes: Attribute[] = null;
    public readonly value: string = null;

    constructor(file: string | Parse5) {
        if (typeof file === "string") {
            this.document = parse5.parse(file);
        } else {
            this.document = file;
        }

        const has: ((property: string) => boolean) = (property: string): boolean => {
            const hasProperty: boolean = Object.keys(this.document).includes(property);
            return hasProperty;
        };
        const get: (<U extends any>(propertyKey: string) => U) = <U extends any>(propertyKey: string): U => {
            const property: U = this.document[propertyKey];
            return property;
        };

        this.hasNodeName = has(Parser.nodeNameKey);
        this.hasChildNodes = has(Parser.childNodesKey);
        this.hasAttributes = has(Parser.attributesKey);
        this.hasValue = has(Parser.valueKey);

        if (this.hasNodeName) {
            this.nodeName = get<string>(Parser.nodeNameKey);
        }
        if (this.hasChildNodes) {
            this.childNodes = get<Parse5[]>(Parser.childNodesKey);
        }
        if (this.hasAttributes) {
            this.attributes = get<Attribute[]>(Parser.attributesKey);
        }
        if (this.hasValue) {
            this.value = get<string>(Parser.valueKey);
        }
    }

    public search(name: string): Parser[] {
        const accumulator: Parser[] = [];

        const recurse: ((document: Parse5) => void) = (document: Parse5): void => {
            const parserDocument: Parser = new Parser(document);

            if (parserDocument.hasNodeName) {
                if (parserDocument.nodeName === name) {
                    accumulator.push(parserDocument);
                }
            }
            if (parserDocument.hasChildNodes) {
                parserDocument.childNodes.forEach(recurse);
            }
        };

        recurse(this.document);
        return accumulator;
    }

    public searchThroughChildOnly(name: string): Parser[] {
        const accumulator: Parser[] = [];

        if (this.hasChildNodes) {
            this.childNodes.forEach((child: Parse5): void => {
                const newChild: Parser = new Parser(child);

                if (newChild.hasNodeName) {
                    if (newChild.nodeName === name) {
                        accumulator.push(newChild);
                    }
                }
            });
        }

        return accumulator;
    }
}
