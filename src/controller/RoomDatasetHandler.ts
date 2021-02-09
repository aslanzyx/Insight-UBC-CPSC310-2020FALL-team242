import JSZip = require("jszip");
import { InsightError } from "./IInsightFacade";
import { Parser } from "./Parser";
import * as fse from "fs-extra";
import * as http from "http";
import Log from "../Util";


export class RoomDatasetHandler {
    private id: string;
    private content: string;

    private buildings: any;

    public datasets: { [id: string]: object[] };
    public metaInfo: { [id: string]: any };

    constructor(id: string, content: string, datasets: any, metaInfo: any) {
        this.id = id;
        this.content = content;
        this.datasets = datasets;
        this.metaInfo = metaInfo;
    }

    public addRoomDataset(): Promise<string[]> {
        try {
            this.checkId();
            if (Object.keys(this.metaInfo).includes(this.id)) {
                throw new InsightError("dupliacted room dataset");
            }
            this.buildings = this.parseBuildings();
            return this.parseRoomSources();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    private checkId() {
        if (this.id.includes("_")) {
            throw new InsightError("Dataset id should not include underscore!");
        }
        if (this.id.indexOf(" ") >= 0) {
            throw new InsightError("Dataset id should not include whitespace!");
        }
        if (this.id === "" || this.id === null || this.id === undefined) {
            throw new InsightError("Dataset id is null or undefined!");
        }
    }


    private parseBuildingSources() {
        return new JSZip().loadAsync(this.content, { base64: true })
            .then<string>((value: JSZip): Promise<string> => {
                return value.file("rooms/index.htm").async("string");
            })
            .catch<string>((error: any): string => {
                throw new InsightError(error);
            });
    }

    private parseBuildings() {
        return this.parseBuildingSources().then((soln: string) => {
            return this.parseBuildingHelper(soln);
        }).catch((err) => {
            throw new InsightError(err);
        });
    }

    private parseBuildingHelper(soln: string) {
        let promiseList: Array<Promise<any>> = [];
        let buildings: any[] = [];
        let parser = new Parser(soln);
        let table = parser.search("table")[0];
        if (table !== undefined) {
            let tbody = table.search("tbody")[0];
            let trs = tbody.searchThroughChildOnly("tr");

            trs.forEach((tr: Parser) => {
                let tds = tr.searchThroughChildOnly("td");
                let b = {
                    fullname: tds[2].searchThroughChildOnly("a")[0].searchThroughChildOnly("#text")[0].value.trim(),
                    shortname: tds[1].searchThroughChildOnly("#text")[0].value.trim(),
                    address: tds[3].searchThroughChildOnly("#text")[0].value.trim(),
                    href: tds[4].searchThroughChildOnly("a")[0]
                        .attributes[0].value,
                    lat: 0,
                    lon: 0,
                };
                promiseList.push(this.parseGeo(b.address).then((loc: any) => {
                    b.lat = loc.lat;
                    b.lon = loc.lon;
                    buildings.push(b);
                }).catch((err) => {
                    buildings.push(b);
                }));
            });
        }
        return Promise.all(promiseList).then((solns: any[]) => {
            return buildings;
        });
    }

    private parseGeo(address: string) {
        let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team242/";
        let addr = encodeURIComponent(address);
        return new Promise((resolve, reject) => {
            http.get(url.concat(addr)).on("response", (res: http.IncomingMessage) => {
                if (res.statusCode === 200) {
                    res.on("data", (chunk: any) => {
                        return resolve(JSON.parse(chunk.toString()));
                    });
                } else {
                    throw new InsightError("geo locationconnection issues");
                }
            }).on("error", (err) => {
                return reject(err);
            });
            // Log.info(buildings[buildings.length - 1]);
        });
    }

    private parseRoomSources() {
        let that = this;
        return this.buildings.then((soln: any[]) => {
            const roomList: any[] = [];
            const promiseList: any[] = [];
            soln.forEach((building: any) => {
                promiseList.push(this.addRooms(building, roomList));
            });
            return Promise.all(promiseList).then((val: any[]) => {
                if (roomList.length === 0) {
                    throw new InsightError(("No rooms!"));
                }
                this.loadBack(roomList);
                return Object.keys(that.datasets);
            });
        }).catch((err: any) => {
            throw new InsightError(err);
        });
    }

    private loadBack(roomList: any[]) {
        let metaObj: { [name: string]: any } = {};
        metaObj["id"] = this.id;
        metaObj["kind"] = "rooms";
        metaObj["numRows"] = roomList.length;
        this.datasets[this.id] = roomList;
        this.metaInfo[this.id] = metaObj;

        const datasetCachePath = `./data/${this.id}.json`;
        const metaCachePath = `./data/metaInfo.json`;
        fse.createFileSync(datasetCachePath);
        fse.writeFileSync(datasetCachePath, JSON.stringify(this.datasets[this.id]));
        fse.writeFileSync(metaCachePath, JSON.stringify(this.metaInfo));
    }

    private addRooms(building: any, roomList: any[]) {
        return new JSZip().loadAsync(this.content, { base64: true }).then((zip: JSZip) => {
            return zip.file("rooms".concat(building.href.substr(1))).async("string").then((soln: string) => {
                return this.parseRooms(soln, building, roomList);
            });
        }).catch((err) => {
            throw new InsightError(err);
        });
    }

    private parseRooms(soln: string, building: any, roomList: any[]) {
        let parser = new Parser(soln);
        let table = parser.search("table")[0];
        if (table !== undefined) {
            let tbody = table.search("tbody")[0];
            let trs = tbody.searchThroughChildOnly("tr");

            trs.forEach((tr: Parser) => {
                let tds = tr.searchThroughChildOnly("td");
                let r: any = {};
                r[this.id.concat("_fullname")] = building.fullname;
                r[this.id.concat("_shortname")] = building.shortname;
                r[this.id.concat("_number")] = tds[0].searchThroughChildOnly("a")[0].childNodes[0].value;
                r[this.id.concat("_name")] = building.shortname.concat("_")
                    .concat(tds[0].searchThroughChildOnly("a")[0].childNodes[0].value);
                r[this.id.concat("_address")] = building.address;
                r[this.id.concat("_lat")] = building.lat;
                r[this.id.concat("_lon")] = building.lon;
                r[this.id.concat("_seats")] = Number(tds[1].searchThroughChildOnly("#text")[0].value);
                r[this.id.concat("_type")] = tds[3].searchThroughChildOnly("#text")[0].value.trim();
                r[this.id.concat("_furniture")] = tds[2].searchThroughChildOnly("#text")[0].value.trim();
                r[this.id.concat("_href")] = tds[4].searchThroughChildOnly("a")[0].attributes[0].value;
                roomList.push(r);
            });
        }
        return Promise.resolve(0);
    }
}
