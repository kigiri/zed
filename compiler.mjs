const jsPrint = {
  string: v => `'${v}'`,
  symbol: v => `@${v}`,
  indentifier: _=>_,
  number: _=>_,
  list: _ => ({ open: '(', close: ')' })[_]
}

const prettify = node => Array.isArray(node)
  ? node.map(prettify)
  : jsPrint[node.type](node.value)

export { prettify }
