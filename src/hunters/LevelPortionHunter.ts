import {ILineHunter} from './ILineHunter';
import {createWriteStream, unlinkSync, WriteStream} from 'fs';
import {Chapter, PdfLevel, Section, SubSection} from '../entities/PdfLevel';
import {PdfPortion, PortionType} from '../entities/PdfPortion';
import {EOL} from 'os';
import {join} from 'path';
import {MathEnvironment} from './math/MathEnvironment';

export class LevelPortionHunter implements ILineHunter {

    private readonly levelHunter = new LevelCounter();

    private writtenLines = 0;

    private portionId: number = 0;

    private currentWriteStream?: WriteStream;
    private currentFilePath?: string;

    private currentMathEnv?: MathEnvironment;
    private mathEnvs = [
        MathEnvironment.createDefinitionEnv(),
        MathEnvironment.createTheoremEnv(),
        MathEnvironment.createLemmaEnv(),
        MathEnvironment.createCorollaryEnv(),
        MathEnvironment.createExampleEnv(),
        MathEnvironment.createRemarkEnv(),
        MathEnvironment.createExerciseEnv()
    ];

    private definitionCounter = 0;

    constructor(
        readonly outputFolderPath: string,
        readonly outputRelativePreamblePath: string,
        readonly writeStreamOptions?: {
            flags?: string;
            encoding?: BufferEncoding;
            fd?: number;
            mode?: number;
            autoClose?: boolean;
            emitClose?: boolean;
            start?: number;
            highWaterMark?: number;
        },
        readonly levels: Array<PdfLevel> = [],
        readonly portions: Array<PdfPortion> = []
    ) {
    }

    get levelPath(): string {
        return `${this.levelHunter.chapterCounter}-${this.levelHunter.sectionCounter}-${this.levelHunter.subSectionCounter}-${this.portionId}`;
    }

    read(line: string): ILineHunter {
        const newLevel = this.levelHunter.read(line);
        if (newLevel) {
            this.levels.push(newLevel);
            this.closePortion();
            if (newLevel instanceof Section)
                this.definitionCounter = 0;

            return this;
        } else {
            if (this.currentMathEnv) {
                if (this.currentMathEnv.testClosing(line)) {
                    this.writeLine(line);
                    this.closePortion();
                    this.currentMathEnv = undefined;
                    return this;
                }
            } else {
                this.currentMathEnv = this.mathEnvs.find(env => env.testOpening(line));
                if (this.currentMathEnv) {
                    this.closePortion();
                    this.startNewPortion(this.currentMathEnv.type);
                    this.definitionCounter++;
                }
            }

            if (!this.currentWriteStream) {
                this.startNewPortion('other')
            }

            this.writeLine(line);
        }

        return this;
    }

    writeLine (s: string) {
        if (s.trim().length > 0)
            this.writtenLines++;
        this.currentWriteStream.write(s);
        this.currentWriteStream.write(EOL);
    }


    startNewPortion(type: PortionType) {
        this.portionId++;
        this.currentFilePath = join(this.outputFolderPath, `${this.levelPath}-${type}.tex`);
        this.currentWriteStream = createWriteStream(this.currentFilePath, this.writeStreamOptions);
        this.writeLine(`\\input{${this.outputRelativePreamblePath}}`);
        this.writeLine(`\\begin{document}`);
        // this.writeLine(`\\setcounter{chapter}{${this.levelHunter.chapterCounter}}`);
        this.writeLine(`\\setcounter{section}{${this.levelHunter.sectionCounter}}`);
        this.writeLine(`\\setcounter{subsection}{${this.levelHunter.subSectionCounter}}`);
        this.writeLine(`\\setcounter{dfn}{${this.definitionCounter}}`);
        this.writtenLines = 0;
        this.currentWriteStream.write(EOL);
    }

    closePortion() {
        if (this.currentWriteStream) {
            if (this.writtenLines === 0) {
                const currentFilePath = this.currentFilePath;
                this.currentWriteStream.end(() => {
                    unlinkSync(currentFilePath)
                });
                this.currentWriteStream = undefined;
                return;
            }

            this.currentWriteStream.write(EOL);
            this.writeLine(`\\end{document}`);
            this.currentWriteStream.end();
            this.currentWriteStream = undefined;
        }
    }
}

export class LevelCounter {

    static readonly chapterLevel = /\\chapter{(.+)}/;
    static readonly sectionLevel = /\\section{(.+)}/;
    static readonly subSectionLevel = /\\subsection{(.+)}/;

    private _chapterCounter = 0;
    private _sectionCounter = 0;
    private _subSectionCounter = 0;

    private currentChapter: Chapter;
    private currentSection: Section;
    private currentSubsection: SubSection;

    // private repository: Repository<PdfLevel>;

    constructor(
        readonly listener?: LevelsChangeListener
    ) {
        // this.repository = getRepository(PdfLevel);
    }

    get chapterCounter(): number {
        return this._chapterCounter;
    }

    get sectionCounter(): number {
        return this._sectionCounter;
    }

    get subSectionCounter(): number {
        return this._subSectionCounter;
    }

    read(line: string): PdfLevel | undefined {
        let match;
        if ((match = line.match(LevelCounter.subSectionLevel))) {
            this._subSectionCounter++;
            this.currentSubsection = new SubSection(this.currentSection, match[1]);
            if (this.listener?.onNewSubSection)
                this.listener.onNewSubSection([this._chapterCounter, this._sectionCounter, this._subSectionCounter], this.currentSubsection);

            return this.currentSubsection;
        } else if ((match = line.match(LevelCounter.sectionLevel))) {
            this._sectionCounter++;
            this._subSectionCounter = 0;
            this.currentSubsection = undefined;
            this.currentSection = new Section(this.currentChapter, match[1]);
            if (this.listener?.onNewSection)
                this.listener.onNewSection([this._chapterCounter, this._sectionCounter], this.currentSection);

            return this.currentSection;
        } else if ((match = line.match(LevelCounter.chapterLevel))) {
            this._chapterCounter++;
            this._sectionCounter = 0;
            this._subSectionCounter = 0;
            this.currentSection = undefined;
            this.currentSubsection = undefined;
            this.currentChapter = new Chapter(match[1]);
            if (this.listener?.onNewChapter)
                this.listener.onNewChapter([this._chapterCounter], this.currentChapter);

            return this.currentChapter;
        }

        return undefined;
    }
}

export interface LevelsChangeListener {
    onNewChapter?(levels: [number], chapter: Chapter);

    onNewSection?(levels: [number, number], chapter: Section);

    onNewSubSection?(levels: [number, number, number], chapter: SubSection);
}
