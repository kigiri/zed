import fs from 'fs'
import assert from 'assert'
import parser from './parser.mjs'
import { prettify, toJS, toEStree } from './compiler.mjs'
import util from 'util'

const [ filter ] = process.argv.slice(2)

const log = console.log
let hasFailed = false
const tests = Promise.all(fs.readdirSync('./tests')
  .map(async filename => ({
    filename: filename.split(/\.(ast|zed|js|estree)(\.json)?$/)[0],
    content: await fs.promises.readFile(`./tests/${filename}`, 'utf8'),
    type: filename.split('.')[1]
  })))
  .then(tests => Object.entries(tests.reduce((acc, { filename, type, content }) => {
      if (filter && filename !== filter) return acc
      ;(acc[filename] || (acc[filename] = {}))[type] = content
      return acc
    }, {}))
    .forEach(async ([ name, { ast, zed, js, estree } ]) => {
      // log('        ---====||||====---')
      const logData = []
      console.log = (...args) => { logData.push(args) }
      try {
        const parsed = parser(zed)
        if (!ast) {
          log('generating ast')
          await fs.promises.writeFile(`./tests/${name}.ast.json`,
            JSON.stringify(prettify(parsed), null, 2), 'utf8')
        } else {
          assert.deepStrictEqual(JSON.parse(ast), prettify(parsed),
            'compare ast')
        }
        if (!js) {
          log('generating js')
          await fs.promises.writeFile(`./tests/${name}.js`,
            parsed.map(toJS).join('\n'), 'utf8')
        }
        if (!estree) {
          log('generating estree')
          await fs.promises.writeFile(`./tests/${name}.estree.json`,
            JSON.stringify(toEStree(parsed), null, 2), 'utf8')
        } else {
          assert.deepStrictEqual(JSON.parse(estree), toEStree(parsed),
            'compare estree')
        }
        log('=> O', name)
      } catch (err) {
        log('=> X', name)
        if (!hasFailed && !err.message.includes('JSON')) {
          hasFailed = true
          log(err.message)
          if (logData.length) {
            log('================= logs ==================')
            logData.forEach(args => log(...args))
          }
          log('================= code ==================')
          log(zed)
          log('================= data ==================')
          if (err.message.includes('compare ast')) {
            log('=== EXPECTED')
            console.dir(JSON.parse(ast), { depth: null })
            log('\n=== GOT')
            console.dir(prettify(parser(zed)), { depth: null })
          } else if (err.message.includes('compare estree')) {
            log('=== EXPECTED')
            console.dir(JSON.parse(estree).body[0], { depth: null })
            log('\n=== GOT')
            console.dir(toEStree(parser(zed)).body[0], { depth: null })
            // log('out', util.inspect(JSON.parse(estree).body[0], false, null))
          }
        }
      }
    }))
