import { randomBytes } from "node:crypto";

export const replaceBrackets = (template: string, replacements: { [key: string]: string }): string => {
    return template.replace(/\{\{\s*(\.\w+)\s*\}\}/g, (match, p1) => {
        const key = p1.slice(1); // Remove the leading dot
        return key in replacements ? replacements[key] : match;
    });
}

export const randomString=(length: number): string =>{
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
    
    const randomValues = randomBytes(length);
    for (let i = 0; i < length; i++) {
        const randomIndex = randomValues[i] % charactersLength;
        result += characters.charAt(randomIndex);
    }
    
    return result;
}