export function normalizeTex (s: string = ""): string {
    return normalizeCommand(normalizeDiaeresis(s));
}

export function normalizeCommand (s: string = ""): string {
    return s.replace('\\', '');
}

// tréma
export function normalizeDiaeresis (s: string = ""): string {
    const reg = /\\"([aouAOU])/g;
    const translations = {
        "a": "ä",
        "o": "ö",
        "u": "ü",
        "A": "Ä",
        "O": "Ö",
        "U": "Ü"
    };
    let match;
    while((match = reg.exec(s))) {
        s = s.replace(match[0], translations[match[1]]);
    }
    return s;
}
