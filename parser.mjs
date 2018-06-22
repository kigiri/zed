const backslashed = {}
const getBackslashed = n => backslashed[n] || (backslashed[n] = eval(`'\\${n}'`))

const tokenize = raw => {
  let value = ''
  let type = ''
  let inStr = false
  let backslash = false
  let inIndent = false
  let indent = 0
  let expr = []
  const lines = [ expr ]
  const add = () => {
    if (!inStr && !value) return
    const node = { type, value }
    if (!expr.length) {
      expr.indent = indent
    }
    expr.push(node)
    value = ''
    type = ''
  }

  let i = -1
  while (++i < raw.length) {
    const c = raw[i]
    if (inStr) {
      if (backslash) {
        value += getBackslashed(c)
        backslash = false
      } else {
        switch (c) {
          case '\\': {
            backslash = true
            break
          }
          case "'": {
            type = 'string'
            add()
            inStr = false
            break
          }
          default: {
            value += c
            break;
          }
        }
      }
    } else if (inIndent && c === ' ') {
      indent++
    } else if (c === '\n') {
      add()
      indent = 0
      inIndent = true
      lines.push(expr = [])
    } else {
      inIndent = false
      switch (c) {
        case "'": {
          add()
          inStr = true
          break
        }
        case '(': {
          add()
          const next = []
          next.parent = expr
          expr.push(expr = next)
          break
        }
        case ')': {
          add()
          expr = expr.parent
          break
        }
        case '\t':
        case ' ': {
          if (type) {
            add()
          }
          break
        }
        default: {
          if (!type) {
            if (/[0-9]/.test(c)) {
              type = 'number'
            } else if (/[_$a-zA-Z]/.test(c)) {
              type = 'indentifier'
            } else {
              type = 'symbol'
            }
          } else if (type === 'indentifier') {
            if (!/[_$a-zA-Z0-9.]/.test(c)) {
              add()
            }
          }
          value += c
        }
      }
    }
  }
  add()
  return lines.filter(line => line.length)
}

const solve = lines => lines.map(recurSolve)
const recurSolve = line => {
  if ('indent' in line) {
    return line.length > 1
      ? solve(line)
      : line[0]
  }
  return line
}

const indentify = (lines) => {
  const result = []
  for (let [ index, line ] of Object.entries(lines)) {
    const { indent } = line
    let parent = result
    while (--index >= 0) {
      const l = lines[index]
      if (l.indent < indent) {
        parent = l
        break
      }
    }
    parent.push(line)
  }
  return result
}

export default raw => solve(indentify(tokenize(raw)))
