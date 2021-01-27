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

    protected constructor(parent: PdfLevel, text: string) {
        this.parent = parent;
        this.text = text;
    }
}

@ChildEntity()
export class Chapter extends PdfLevel {
    constructor(text: string) {
        super(undefined, text);
    }
}

@ChildEntity()
export class Section extends PdfLevel {
    constructor(parent: Chapter, text: string) {
        super(parent, text);
    }
}

@ChildEntity()
export class SubSection extends PdfLevel {
    constructor(parent: Section, text: string) {
        super(parent, text);
    }
}
