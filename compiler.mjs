const jsPrint = {
  Symbol: v => `@${v}`,
  Identifier: _=>_,
  String: _=>_,
  Number: _=>_,
}

const toJS = node => Array.isArray(node)
  ? `${toJS(node[0])}(${node.slice(1).map(toJS).join(', ')})`
  : jsPrint[node.type](node.value)

const parseNode = node => {
  if (Array.isArray(node)) {
    switch (node.type) {
      default: {
        const [ callee, ...args ] = node.map(parseNode)
        const end = (args[args.length - 1] || callee).end
        console.log(callee)
        return {
          type: 'CallExpression',
          start: node.start !== undefined ? node.start : callee.start,
          end: node.end || end,
          callee,
          arguments: args
        }
      }
    }
  } else {
    switch (node.type) {
      case 'Identifier': {
        return {
          type: 'Identifier',
          start: node.start,
          end: node.end,
          name: node.value
        }
      }
      case 'Number':
      case 'String': {
        const raw = jsPrint[node.type](node.value)
        return {
          type: 'Literal',
          start: node.start,
          end: node.end,
          value: eval(raw),
          raw
        }
      }
    }
  }
}

const toEStree = nodes => {
  const body = nodes.map(parseNode)
    .map(expression => ({
      type: 'ExpressionStatement',
      start: expression.start,
      end: expression.end,
      expression
    }))
  const last = body[body.length - 1]
  console.log({last})
  return {
    type: 'Program',
    start: 0,
    end: last ? last.end : 0,
    body,
    sourceType: 'module'
  }
}

const prettify = node => Array.isArray(node)
  ? node.map(prettify)
  : jsPrint[node.type](node.value)

export { prettify, toJS, toEStree }
