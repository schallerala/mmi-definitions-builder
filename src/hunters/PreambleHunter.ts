import {ILineHunter} from './ILineHunter';
import {WriteStream} from 'fs';
import {EOL} from 'os';
import {NoopHunter} from './NoopHunter';
import {LevelPortionHunter} from './LevelPortionHunter';

export class PreambleHunter implements ILineHunter {

    static readonly documentBeginning = /\\mainmatter/;
    static readonly documentEnd = /\\bibliographystyle/;

    private documentStarted = false;

    constructor(
        readonly levelPortionHunter: LevelPortionHunter
    ) {
    }

    read(line: string): ILineHunter {
        if (!this.documentStarted) {
            if (PreambleHunter.documentBeginning.test(line)) {
                this.documentStarted = true;
            }
        } else {
            if (PreambleHunter.documentEnd.test(line)) {
                this.levelPortionHunter.commitPortion();
                return new NoopHunter();
            } else {
                this.levelPortionHunter.read(line);
            }
        }

        return this;
    }
}
