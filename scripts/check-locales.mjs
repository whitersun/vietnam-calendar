import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const codes = ['vi', 'en', 'zh-TW', 'zh-CN']

function flatten(value, prefix = '', output = {}) {
  for (const [key, item] of Object.entries(value)) {
    const name = prefix ? `${prefix}.${key}` : key
    if (typeof item === 'string') {
      assert.ok(item.trim(), `Empty translation: ${name}`)
      output[name] = item
    }
    else flatten(item, name, output)
  }
  return output
}

const dictionaries = {}
for (const code of codes) {
  dictionaries[code] = flatten(JSON.parse(await readFile(path.join(root, 'i18n/locales', `${code}.json`), 'utf8')))
}
const base = dictionaries.vi
const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
for (const code of codes) {
  assert.deepEqual(Object.keys(dictionaries[code]).sort(), Object.keys(base).sort(), `${code}: translation keys differ`)
  for (const key of Object.keys(base)) {
    assert.deepEqual(placeholders(dictionaries[code][key]), placeholders(base[key]), `${code}: placeholders differ at ${key}`)
  }
}

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) await scan(target)
    else if (/\.(vue|ts)$/.test(entry.name)) {
      const source = await readFile(target, 'utf8')
      for (const match of source.matchAll(/\bt\(['"]([\w.]+)['"]/g)) {
        assert.ok(Object.hasOwn(base, match[1]), `Missing translation ${match[1]} in ${target}`)
      }
    }
  }
}
await scan(path.join(root, 'app'))
console.log(`OK: ${codes.length} locales, ${Object.keys(base).length} matching keys, placeholders and static UI references.`)
