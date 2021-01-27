import {exec, ExecOptions} from 'child_process';

export function execPdfToText(file: string, cwd: string): Promise<void> {
    const txtFile = `${file.substring(0, file.length - 4)}.txt`;
    return promiseExec(`pdftotext ${file} ${txtFile}`, {
        cwd
    });
}

export function execPandocToMd(file: string, cwd: string): Promise<void> {
    const mdFile = `${file.substring(0, file.length - 4)}.md`;
    return promiseExec(`pandoc --from=latex --to=markdown ${file} | grep -v "^:::" > ${mdFile}`, {
        cwd
    });
}

export function execPdfLatex(file: string, cwd: string): Promise<void> {
    return promiseExec(`pdflatex -synctex=1 -interaction=nonstopmode -file-line-error ${file}`, {
        cwd
    });
}

export function execStorkBuild(storkConfigFile: string): Promise<void> {
    return promiseExec(`stork --build ${storkConfigFile}`);
}

export function promiseExec(command: string, args?: ExecOptions): Promise<void> {
    const childProcess = exec(command, args);

    return new Promise(((resolve, reject) => {
        childProcess.on('close', code => {
            if (code === 0)
                resolve(undefined);
            else
                reject(code);
        })
    }))
}
