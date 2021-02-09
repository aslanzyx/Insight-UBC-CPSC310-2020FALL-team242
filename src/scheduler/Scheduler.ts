import { IScheduler, SchedRoom, SchedSection, TimeSlot } from "./IScheduler";

export default class Scheduler implements IScheduler {

    private static TIME_SLOTS = [
        "MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
        "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
        "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
        "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
        "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"
    ];

    private static NUM_SLOT = 15;

    // private sectionHashTable: Array<{ id: number, size: number }> = [];
    // private roomHashTable: Array<{ id: number, size: number }> = [];
    private courseAvailabilities: any = {};
    private roomAvailabilities: any = [];

    private sections: SchedSection[];
    private rooms: SchedRoom[];
    private selected: Array<{ room: SchedRoom, valid: number }> = [];

    private sectionPointer: number = 0;
    private roomPointer: number = 0;

    private curSchedule: any = [];

    private sortSections() {
        this.sections.sort((a: SchedSection, b: SchedSection) => {
            return Scheduler.sectionSize(b) - Scheduler.sectionSize(a);
        });
    }

    private sortRooms() {
        this.rooms.sort((a: SchedRoom, b: SchedRoom) => {
            return b.rooms_seats - a.rooms_seats;
        });
    }

    private initCourseAvailabilities() {
        this.sections.forEach((s: SchedSection) => {
            let key = s.courses_dept.concat(s.courses_id);
            if (this.courseAvailabilities[key] === undefined) {
                this.courseAvailabilities[key] = new Array<boolean>(Scheduler.NUM_SLOT).fill(true);
            }
        });
    }

    private initRoomAvailabilities() {
        this.rooms.forEach((r: SchedRoom) => {
            this.roomAvailabilities.push(Array<boolean>(Scheduler.NUM_SLOT).fill(true));
        });
    }

    private static sectionSize(section: SchedSection) {
        return section.courses_pass + section.courses_fail + section.courses_audit;
    }

    private static computeSquareDistance(r0: SchedRoom, r1: SchedRoom) {
        return Math.sqrt(
            Math.pow(r0.rooms_lat - r1.rooms_lat, 2) +
            Math.pow(r0.rooms_lon - r1.rooms_lon, 2)
        );
    }

    private removeRoom(room: SchedRoom) {
        let offset = this.rooms.indexOf(room);
        for (let i = offset; i > this.roomPointer; i--) {
            this.rooms[i] = this.rooms[i - 1];
        }
        this.roomPointer++;
    }

    private iterateSelected() {
        let section = this.sections[this.sectionPointer];
        for (let selection of this.selected) {
            if (selection.valid > 0 &&
                Scheduler.sectionSize(section) < selection.room.rooms_seats) {
                let flag = this.matchSection(section, selection.room);
                if (flag) {
                    selection.valid--;
                    this.sectionPointer++;
                    return true;
                }
            }
        }
        return false;
    }

    // get new selection
    private getNewSelection() {
        let availableRooms = this.searchForAvailableRoom();
        let room = this.getMinDistancePoint(availableRooms);
        // no fitted room
        if (room === null) {
            this.sectionPointer++;
            return false;
        }
        // match and remove and push
        this.matchSection(this.sections[this.sectionPointer], room);
        this.removeRoom(room);
        this.selected.push({
            room: room,
            valid: Scheduler.NUM_SLOT - 1
        });
        return true;
    }


    // find avail rooms for cur section
    private searchForAvailableRoom() {
        let end = this.roomPointer;
        let threshold = Scheduler.sectionSize(this.sections[this.sectionPointer]);
        let selected = [];
        while (end < this.rooms.length &&
            this.rooms[end].rooms_seats > threshold) {
            selected.push(this.rooms[end]);
            end++;
        }
        return selected;
    }

    // min max distance point of given rooms
    private getMinDistancePoint(selectedRooms: SchedRoom[]) {
        let tmp = null;
        let minMaxDistance = null;
        for (let room of selectedRooms) {
            let maxDistance = 0;
            this.selected.forEach((r: any) => {
                let distance = Scheduler.computeSquareDistance(r.room, room);
                if (distance > maxDistance) {
                    maxDistance = distance;
                }
            });
            if (tmp === null || maxDistance < tmp) {
                tmp = maxDistance;
                minMaxDistance = room;
            }
        }
        return minMaxDistance;
    }

    private matchSection(section: SchedSection, room: SchedRoom) {
        for (let i = 0; i < Scheduler.NUM_SLOT; i++) {
            let key = section.courses_dept.concat(section.courses_id);
            if (this.courseAvailabilities[key][i] &&
                this.roomAvailabilities[this.roomPointer][i]) {
                this.courseAvailabilities[key][i] = false;
                this.roomAvailabilities[this.roomPointer][i] = false;
                this.curSchedule.push([room, section, Scheduler.TIME_SLOTS[i]]);
                return true;
            }
        }
        return false;
    }


    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        this.sections = sections;
        this.rooms = rooms;

        this.sortSections();
        this.sortRooms();
        this.initCourseAvailabilities();
        this.initRoomAvailabilities();

        let startRooms = this.searchForAvailableRoom();
        while (startRooms.length === 0) {
            this.sectionPointer++;
            startRooms = this.searchForAvailableRoom();
        }
        let startRoom = startRooms[startRooms.length - 1];
        this.selected.push({
            room: startRoom,
            valid: Scheduler.NUM_SLOT
        });

        while (this.sectionPointer < sections.length &&
            this.roomPointer < rooms.length) {
            let flag = this.iterateSelected();
            if (!flag) {
                this.getNewSelection();
            }
        }

        return this.curSchedule;
    }

}
