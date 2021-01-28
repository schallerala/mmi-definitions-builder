import {ILineHunter} from './ILineHunter';
import {createWriteStream, WriteStream} from 'fs';
import {PdfLevel} from '../entities/PdfLevel';
import {PdfPortion, PortionType} from '../entities/PdfPortion';
import {EOL} from 'os';
import {join} from 'path';
import {MathEnvironment} from './math/MathEnvironment';
import {normalizeTex} from '../utils/normalizeTex';

export class LevelPortionHunter implements ILineHunter {

    static readonly labelRegExp = /\\label{([^}]+)}/;
    static readonly refRegExp = /\\ref{([^}]+)}/;

    private readonly levelHunter = new LevelCounter();

    private portionId: number = 1;

    private currentPortionLines = new Array<string>();

    private currentMathEnv?: MathEnvironment;
    private mathEnvs = [
        MathEnvironment.createDefinitionEnv(),
        MathEnvironment.createTheoremEnv(),
        MathEnvironment.createLemmaEnv(),
        MathEnvironment.createCorollaryEnv(),
        MathEnvironment.createExampleEnv(),
        MathEnvironment.createRemarkEnv(),
    ];

    private definitionCounter = 0;

    readonly levels = new Array<PdfLevel>();
    readonly pdfPortions = new Array<PdfPortion>();

    private currentOpenPortion?: PdfPortion;

    constructor(
        readonly outputFolderPath: string,
        readonly continuousMultiStandaloneStream: WriteStream,
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
    ) {
    }

    get levelPath(): string {
        return `${this.portionId}--${this.levelHunter.chapterCounter}-${this.levelHunter.sectionCounter}-${this.levelHunter.subSectionCounter}`;
    }

    get currentLevel(): PdfLevel {
        return this.levels[this.levels.length - 1];
    }

    read(line: string): ILineHunter {
        const newLevel = this.levelHunter.read(line);
        if (newLevel) {
            const previousLevel = this.currentLevel;
            this.levels.push(newLevel);
            if (previousLevel && newLevel.rootChapter === previousLevel.rootChapter && this.currentOpenPortion.type === 'level') {
                // merge the portions, by saving the buffer and infecting it in the new portion
                const currentLines = this.currentPortionLines;
                this.startNewPortion("level", newLevel.numberedTitle);
                this.currentPortionLines.push(...currentLines);
            } else {
                this.commitPortion();
                this.startNewPortion("level", newLevel.numberedTitle)
            }
            if (newLevel.type === 'section')
                this.definitionCounter = 0;
        }

        if (!this.currentMathEnv) {
            this.currentMathEnv = this.mathEnvs.find(env => env.testOpening(line));
            if (this.currentMathEnv) {
                this.commitPortion();
                const mathTitle = this.createMathTitle(this.currentMathEnv);
                this.startNewPortion(this.currentMathEnv.type, mathTitle);
                this.definitionCounter++;
            }
        } else {
            if (this.currentMathEnv.testClosing(line)) {
                this.writeLine(line);
                this.commitPortion();
                this.currentMathEnv = undefined;
                return this;
            }
        }

        this.writeLine(line);

        return this;
    }

    createMathTitle(mathEnv: MathEnvironment) {
        let numberedEnv = `${mathEnv.capitalizedType} ${this.levelHunter.sectionCounter}.${this.definitionCounter + 1}.`;
        if (mathEnv.lastTitle) {
            numberedEnv = `${numberedEnv} (${mathEnv.lastTitle})`;
        }

        return `${numberedEnv}: ${this.currentLevel.breadcrumb}`;
    }

    writeLine (line: string) {
        this.currentPortionLines.push(line);
        let match;
        if ((match = line.match(LevelPortionHunter.labelRegExp))) {
            this.currentOpenPortion.addLabel(match[1]);
        }
        if ((match = line.match(LevelPortionHunter.refRegExp))) {
            this.currentOpenPortion.addReference(match[1]);
        }
    }

    startNewPortion(type: PortionType, title?: string) {
        const texFilePath = join(this.outputFolderPath, `${this.levelPath}-${type}.tex`);

        if (!title) {
            title = this.currentLevel.breadcrumb;
        }
        this.currentOpenPortion = new PdfPortion(this.portionId, type, this.currentLevel, texFilePath, title);

        this.currentPortionLines = new Array<string>();
    }

    commitPortion() {
        const content = this.currentPortionLines.join(EOL);

        if (content.trim().length) {
            this.pdfPortions.push(this.currentOpenPortion);
            this.portionId++;

            const texStream = createWriteStream(this.currentOpenPortion.texPath, this.writeStreamOptions);

            texStream.write(content);
            texStream.end();

            const standalonePage = [
                '',
                `%%%%%%%%%% ${this.currentOpenPortion.texPath}`,
                '\\begin{page}',
                '',
                content,
                '',
                '\\end{page}',
                ''
            ].join(EOL);

            this.continuousMultiStandaloneStream.write(standalonePage);
        }

        // tmp create an "other" portion
        this.startNewPortion("other");
    }
}

export class LevelCounter {

    static readonly chapterLevel = /\\chapter{(.+)}/;
    static readonly sectionLevel = /\\section{(.+)}/;
    static readonly subSectionLevel = /\\subsection{(.+)}/;

    private _chapterCounter = 0;
    private _sectionCounter = 0;
    private _subSectionCounter = 0;

    private currentChapter: PdfLevel;
    private currentSection: PdfLevel;
    private currentSubsection: PdfLevel;

    constructor(
    ) {
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
            this.currentSubsection = PdfLevel.createSubsection(this.currentSection, this._subSectionCounter, normalizeTex(match[1]));

            return this.currentSubsection;
        }
        else if ((match = line.match(LevelCounter.sectionLevel))) {
            this._sectionCounter++;
            this._subSectionCounter = 0;
            this.currentSubsection = undefined;
            this.currentSection = PdfLevel.createSection(this.currentChapter, this._sectionCounter, normalizeTex(match[1]));

            return this.currentSection;
        }
        else if ((match = line.match(LevelCounter.chapterLevel))) {
            this._chapterCounter++;
            this._sectionCounter = 0;
            this._subSectionCounter = 0;
            this.currentSection = undefined;
            this.currentSubsection = undefined;
            this.currentChapter = PdfLevel.createChapter(this._chapterCounter, normalizeTex(match[1]));

            return this.currentChapter;
        }

        return undefined;
    }
}
