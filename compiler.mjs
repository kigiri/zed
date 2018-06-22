const jsPrint = {
  string: v => `'${v}'`,
  symbol: v => `@${v}`,
  indentifier: _=>_,
  number: _=>_,
}
const toJS = node => Array.isArray(node)
  ? `${toJS(node[0])}(${node.slice(1).map(toJS).join(', ')})`
  : jsPrint[node.type](node.value)

const prettify = node => Array.isArray(node)
  ? node.map(prettify)
  : jsPrint[node.type](node.value)

export { prettify, toJS }
