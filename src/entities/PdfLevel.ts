import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class PdfLevel {
    @PrimaryGeneratedColumn()
    readonly id: number;

    @ManyToOne(() => PdfLevel)
    readonly parent: PdfLevel;

    @Column()
    readonly level: number;

    @Column()
    readonly text: string;

    @Column()
    readonly type: Levels;

    private constructor(parent: PdfLevel, level: number, text: string, type: Levels) {
        this.parent = parent;
        this.level = level;
        this.text = text;
        this.type = type;
    }

    static createChapter(level: number, text: string) {
        return new PdfLevel(undefined, level, text, 'chapter');
    }

    static createSection(parent: PdfLevel, level: number, text: string) {
        return new PdfLevel(parent, level, text, 'section');
    }

    static createSubsection(parent: PdfLevel, level: number, text: string) {
        return new PdfLevel(parent, level, text, 'subsection');
    }

    get rootChapter(): number {
        let currentLevel: PdfLevel = this;
        while ( !! currentLevel.parent)
            currentLevel = currentLevel.parent;
        return currentLevel.level;
    }

    get numberedTitle(): string {
        const levelNumbers = [];
        let currentLevel: PdfLevel = this;
        do {
            levelNumbers.push(currentLevel.level);
        } while ((currentLevel = currentLevel.parent))
        return `${levelNumbers.reverse().join('.')}. ${this.text}`;
    }

    get breadcrumb(): string {
        const breadcrumbPart = [];
        let currentLevel: PdfLevel = this;
        // Don't add the chapter, which we don't include its title
        while (currentLevel.parent) {
            breadcrumbPart.push(currentLevel.numberedTitle);
            currentLevel = currentLevel.parent;
        }
        // Add only the number of the chapter
        breadcrumbPart.push(`Chap. ${currentLevel.level}.`);
        return breadcrumbPart.reverse().join(' > ');
    }
}

type Levels = 'chapter' | 'section' | 'subsection';
