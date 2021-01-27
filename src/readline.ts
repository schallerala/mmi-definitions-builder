import { Interface } from 'readline';

export * from 'readline';


export function promiseOnClose(readInterface: Interface): Promise<void> {
    return new Promise<void>(resolve => {
        readInterface.on('close', () => {
            resolve(undefined);
        });
    });
}
