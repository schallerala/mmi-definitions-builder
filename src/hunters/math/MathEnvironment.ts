import {PortionType} from '../../entities/PdfPortion';

export class MathEnvironment {

    readonly beginEnvRegex: RegExp;
    readonly endEnvRegex: RegExp;
    readonly capitalizedType: string;

    lastTitle?: string;

    protected constructor(
        readonly envName: string,
        readonly type: PortionType,
    ) {
        // the theorem env might get an optional name
        this.beginEnvRegex = new RegExp(`\\\\begin{${envName}}(\\[(.*)\])?`);
        this.endEnvRegex = new RegExp(`\\\\end{${envName}}`);

        this.capitalizedType = `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    }

    testOpening(line: string): boolean {
        let match;
        if ((match = line.match(this.beginEnvRegex))) {
            this.lastTitle = match[2];
            return true;
        }
        return false;
    }

    testClosing (line: string): boolean {
        return this.endEnvRegex.test(line);

    }

    static createDefinitionEnv (): MathEnvironment {
        return new MathEnvironment('dfn', 'definition');
    }

    static createTheoremEnv (): MathEnvironment {
        return new MathEnvironment('thm', 'theorem');
    }

    static createLemmaEnv (): MathEnvironment {
        return new MathEnvironment('lem', 'lemma');
    }

    static createCorollaryEnv (): MathEnvironment {
        return new MathEnvironment('cor', 'corollary');
    }

    static createExampleEnv (): MathEnvironment {
        return new MathEnvironment('exl', 'example');
    }

    static createRemarkEnv (): MathEnvironment {
        return new MathEnvironment('rem', 'remark');
    }

    static createExerciseEnv (): MathEnvironment {
        return new MathEnvironment('exc', 'exercise');
    }
}
