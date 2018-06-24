const backslashed = {}
const getBackslashed = n => backslashed[n] || (backslashed[n] = eval(`'\\${n}'`))

const tokenize = raw => {
  let value = ''
  let type = ''
  let inStr = false
  let backslash = false
  let inIndent = false
  let inComment = false
  let inMultilineComment = false
  let indent = 0
  let start = 0
  let expr = []
  const lines = [ expr ]
  const push = c => {
    if (!value) {
      start = i
      value = c
    } else {
      value += c
    }
  }
  const add = () => {
    if (!inStr && !value) return
    const node = { type, value, start, end: i }
    if (!expr.length) {
      expr.indent = indent
    }
    expr.push(node)
    expr.end = i
    value = ''
    type = ''
  }

  const pushExpr = (src, next) => {
    add()
    next.parent = expr
    src.push(expr = next)
    expr.start = i
  }

  const resetIndent = () => {
    indent = 0
    inIndent = true
  }

  let i = -1
  let prevC = ''
  while (++i < raw.length) {
    const c = raw[i]
    if (inMultilineComment) {
      if (prevC === '*' && c === '/') {
        inMultilineComment = false
      } else if (c === '\n') {
        resetIndent()
      } else if (inIndent) {
        indent++
      }
    } else if (inComment) {
      if (c === '\n') {
        inComment = false
        resetIndent()
      }
    } else if (inStr) {
      if (backslash) {
        push(getBackslashed(c))
        backslash = false
      } else {
        switch (c) {
          case '\\': {
            backslash = true
            break
          }
          case "'": {
            type = 'String'
            push(c)
            add()
            inStr = false
            break
          }
          default: {
            push(c)
            break;
          }
        }
      }
    } else if (inIndent && c === ' ') {
      indent++
    } else if (c === '\n') {
      pushExpr(lines, [])
      resetIndent()
    } else {
      inIndent = false
      switch (c) {
        case "'": {
          add()
          inStr = true
          push(c)
          break
        }
        case '/': {
          if (prevC === '/') {
            inComment = true
          }
          break
        }
        case '(': {
          pushExpr(expr, [])
          break
        }
        case ')': {
          add()
          expr.end = i - 1
          expr = expr.parent
          expr.end = i
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
          if (prevC === '/' && c === '*') {
            inMultilineComment = true
          } else {
            if (!type) {
              if (/[0-9]/.test(c)) {
                type = 'Number'
              } else if (/[_$a-zA-Z]/.test(c)) {
                type = 'Identifier'
              } else {
                type = 'Symbol'
              }
            } else if (type === 'Identifier') {
              if (!/[_$a-zA-Z0-9.]/.test(c)) {
                type = 'Symbol'
              }
            }
            push(c)
          }
        }
      }
    }
    prevC = c
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

const indentify = lines => {
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
