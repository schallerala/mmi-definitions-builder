import {ChildEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, TableInheritance} from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class PdfLevel {
    @PrimaryGeneratedColumn()
    readonly id: number;

    @ManyToOne(() => PdfLevel)
    readonly parent: PdfLevel;

    @Column()
    readonly level: number;

    @Column()
    readonly text: string;

    protected constructor(parent: PdfLevel, level: number, text: string) {
        this.parent = parent;
        this.level = level;
        this.text = text;
    }

    get numberedTitle(): string {
        const levelNumbers = [];
        let currentLevel: PdfLevel = this;
        do {
            levelNumbers.push(currentLevel.level);
        } while ((currentLevel = currentLevel.parent))
        return `${levelNumbers.reverse().join('.')}. ${this.text}`;
    }
}

@ChildEntity('chapter')
export class Chapter extends PdfLevel {
    constructor(level: number, text: string) {
        super(undefined, level, text);
    }
}

@ChildEntity('section')
export class Section extends PdfLevel {
    constructor(parent: Chapter, level: number, text: string) {
        super(parent, level, text);
    }
}

@ChildEntity('subsection')
export class SubSection extends PdfLevel {
    constructor(parent: Section, level: number, text: string) {
        super(parent, level, text);
    }
}
