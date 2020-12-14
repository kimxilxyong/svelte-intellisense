import * as fs from "fs";
import * as fspath from 'path';
import * as utils from '../utils';
import { parseSync } from 'sveltedoc-parser';
import { TextDocument } from "vscode-languageserver-textdocument";
import { NodeModulesImportResolver } from "./NodeModulesImportResolver";
import { DocumentsCache } from "../DocumentsCache";
import { SvelteDocument } from "../SvelteDocument";
//import { ImportedComponent } from '../interfaces';
import { cosmiconfigSync } from 'cosmiconfig';

export class PackageImportResolver extends NodeModulesImportResolver {

    //private componentName;
    private cosmicPackage;
    private cache: Map<string, any> = new Map();

    constructor(documentsCache: DocumentsCache, documentPath: string, componentName: string) {
        super(documentsCache, documentPath);
        //this.componentName = componentName;
        this.cosmicPackage = cosmiconfigSync(componentName, { packageProp: "main" });
    }

    protected findFileFromPackage(path: string, component: string): string {
        if (path) {
            const moduleSearchPath = fspath.join(this.nodeModulesPath, path);
            const result = this.cosmicPackage.search(moduleSearchPath);
            if (result.config) {
                const loaderDocument = this.documentsCache.getOrCreateDocumentFromCache(fspath.join(moduleSearchPath, result.config));
                //const importedComponent = new ImportedComponent({name: "", path: ""})

                loaderDocument.sveltedoc = undefined;
                let componentFile = null;
                let doc;

                if (this.cache.has(loaderDocument.path)) {
                    doc = this.cache.get(loaderDocument.path);
                } else {
                    doc = parseSync({
                        filename: loaderDocument.path,
                        ignoredVisibilities: [],
                        includeSourceLocations: true,
                        defaultVersion: 3
                    });
                    this.cache.set(loaderDocument.path, doc);
                }

                if (doc) {
                    for (let c of doc.components) {
                        if (c.name === component) {
                            componentFile = fspath.normalize(fspath.join(moduleSearchPath, c.importPath));
                            break;
                        }
                    };
                    return componentFile;
                }

            }
            return null;
        }
        return null;
    }

    public resolve(importee: string, component?: string): SvelteDocument {
        const result = super.resolve(importee);

        if (result !== null) {
            return result;
        }

        let importFilePath = this.findFileFromPackage(importee, component);

        importFilePath = utils.findSvelteFile(importFilePath);
        if (importFilePath !== null) {
            return this.documentsCache.getOrCreateDocumentFromCache(importFilePath);
        }

        return null;
    }

    public resolvePath(partialPath: string): string {
        const result = super.resolvePath(partialPath);

        if (result !== null) {
            return result;
        }

        const importFilePath = this.findFileFromPackage(partialPath, "");

        if (fs.existsSync(importFilePath)) {
            return importFilePath;
        }

        return null;
    }
}

