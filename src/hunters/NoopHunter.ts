import {ILineHunter} from './ILineHunter';

export class NoopHunter implements ILineHunter {
    read(line: string): ILineHunter {
        return this;
    }
}
