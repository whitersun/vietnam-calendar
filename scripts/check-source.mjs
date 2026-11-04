import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate, registerTS } from '@vue/compiler-sfc'
import assert from 'node:assert/strict'
import path from 'node:path'
import ts from 'typescript'

registerTS(() => ts)

const root = fileURLToPath(new URL('../', import.meta.url))
let checked = 0
async function scan(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name)
        if (entry.isDirectory()) await scan(target)
        else if (entry.name.endsWith('.vue')) {
            const source = await readFile(target, 'utf8')
            const { descriptor, errors } = parse(source, { filename: target })
            assert.equal(errors.length, 0, `${target}: ${errors.join(', ')}`)
            const script = descriptor.scriptSetup ? compileScript(descriptor, { id: target }) : undefined
            if (descriptor.template) {
                const result = compileTemplate({
                    source: descriptor.template.content,
                    filename: target,
                    id: target,
                    compilerOptions: { bindingMetadata: script?.bindings },
                })
                assert.equal(result.errors.length, 0, `${target}: ${result.errors.join(', ')}`)
            }
            checked++
        }
    }
}
await scan(path.join(root, 'app'))
console.log(`OK: parsed ${checked} Vue components and checked script/template compilation. No production build run.`)
