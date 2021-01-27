import {ILineHunter} from './ILineHunter';
import {WriteStream} from 'fs';
import {EOL} from 'os';
import {NoopHunter} from './NoopHunter';
import {LevelPortionHunter} from './LevelPortionHunter';

export class PreambleHunter implements ILineHunter {

    static readonly documentClass = /\\documentclass/;
    static readonly documentChapterCommand = /chapter/;
    static readonly documentBeginning = /\\begin{document}/;
    static readonly documentEnd = /\\bibliographystyle/;

    private documentStarted = false;

    constructor(
        readonly preambleStream: WriteStream,
        readonly nextHunter: LevelPortionHunter
    ) {
        this.preambleStream.write('\\documentclass[preview, margin=5mm]{standalone}');
        this.preambleStream.write(EOL);
    }

    read(line: string): ILineHunter {
        if (!this.documentStarted) {
            if (PreambleHunter.documentClass.test(line) || PreambleHunter.documentChapterCommand.test(line)) {
                // skip document class, as we write the standalone already
                // skip also chapter related command, as chapters aren't supported in standalone
            } else if (PreambleHunter.documentBeginning.test(line)) {
                this.documentStarted = true;
                this.preambleStream.end();
            } else {
                this.preambleStream.write(line);
                this.preambleStream.write(EOL);
            }
        } else {
            if (PreambleHunter.documentEnd.test(line)) {
                this.nextHunter.closePortion();
                return new NoopHunter();
            } else {
                this.nextHunter.read(line);
            }
        }

        return this;
    }
}
