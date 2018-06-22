import fs from 'fs'
import assert from 'assert'
import parser from './parser.mjs'
import { prettify, toJS } from './compiler.mjs'


const [ filter ] = process.argv.slice(2)

const log = console.log
let hasFailed = false
const tests = Promise.all(fs.readdirSync('./tests')
  .map(async filename => ({
    filename: filename.split(/(\.ast\.json|\.zed|\.js)$/)[0],
    content: await fs.promises.readFile(`./tests/${filename}`, 'utf8'),
    type: filename.split('.')[1]

  })))
  .then(tests => Object.entries(tests.reduce((acc, { filename, type, content }) => {
      if (filter && filename !== filter) return acc
      ;(acc[filename] || (acc[filename] = {}))[type] = content
      return acc
    }, {}))
    .forEach(async ([ name, { ast, zed, js } ]) => {
      // log('        ---====||||====---')
      const logData = []
      console.log = (...args) => { logData.push(args) }
      try {
        const parsed = prettify(parser(zed))
        if (!ast) {
          log('generating ast')
          await fs.promises.writeFile(`./tests/${name}.ast.json`,
            JSON.stringify(parsed, null, 2), 'utf8')
        } else {
          assert.deepStrictEqual(JSON.parse(ast), parsed)
        }
        if (!js) {
          log('generating js')
          await fs.promises.writeFile(`./tests/${name}.js`,
            parser(zed).map(toJS).join('\n'), 'utf8')
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
          log('zed', prettify(parser(zed))[0])
          log('ast', JSON.parse(ast)[0])
        }
      }
    }))
