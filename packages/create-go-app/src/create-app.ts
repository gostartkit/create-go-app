import { open, mkdir } from 'node:fs/promises';
import path from "node:path";
import { StubVersion, AppGitRev, AppFiles } from "./data";
import { randomString, replaceWithMap } from "./utils";

export const createApp = async ({ prefix, projectName }: {prefix: string, projectName: string}): Promise<void> => {

    const decoder = new TextDecoder("utf-8");
    const stubModuleName = "gostartkit.com/go/app";
    const moduleName = `${prefix}/${projectName}`;

    const v = {
        Key: projectName,
        ModuleName: moduleName,
        DatabaseDriver: "mysql",
        DatabaseHost: "127.0.0.1",
        DatabaseName: projectName,
        DatabaseUser: projectName,
        DatabaseRootPassword: randomString(32),
        DatabasePassword: randomString(32),
        DatabaseCharset: "utf8",
        DatabaseCollation: "utf8_general_ci",
        StubVersion: StubVersion,
        StubGitRev: AppGitRev
    };

    for (const f of AppFiles) {
        const rel = f.key;
        const codeFile = path.join(projectName, rel);
        let value = decoder.decode(f.value);
        if (rel.endsWith(".go") || rel.endsWith(".mod")) {
            value = value.replace(new RegExp(stubModuleName, 'g'), moduleName);
        }
        value = replaceWithMap(value, v);
        const dir = path.dirname(codeFile);

        try {
            await mkdir(dir, { recursive: true });
        } catch (err: any) {
            console.log(`mkdir: ${err}`)
        }

        let w = null;

        try {
            w = await open(codeFile, "w");
            w.write(value);
        }
        catch (err: any) {
            console.log(`write: ${err}`)
        }
        finally {
            await w?.close();
        }
    }
}