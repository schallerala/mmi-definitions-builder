import {PortionType} from '../../entities/PdfPortion';

export class MathEnvironment {

    readonly beginEnvRegex: RegExp;
    readonly endEnvRegex: RegExp;

    private insideEnv = false;

    protected constructor(
        readonly envName: string,
        readonly type: PortionType,
    ) {
        // the theorem env might get an optional name
        this.beginEnvRegex = new RegExp(`\\\\begin{${envName}}(\\[(.*)\])?`);
        this.endEnvRegex = new RegExp(`\\\\end{${envName}}`);
    }

    testOpening(line: string): boolean {
        if (this.beginEnvRegex.test(line)) {
            if (this.insideEnv)
                console.warn('Opening while already inside', this.type);
            this.insideEnv = true;
            return true;
        }
        return false;
    }

    testClosing (line: string): boolean {
        if (this.endEnvRegex.test(line)) {
            if ( ! this.insideEnv)
                console.warn('Closing while not open...', this.type);
            this.insideEnv = false;
            return true;
        }
        return false;
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
