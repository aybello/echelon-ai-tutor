/** Replace only the balanced application mount div, preserving scripts and suffixes. */
export function replaceAppRoot(template: string, body: string): string {
  const start = /<div\b[^>]*\bid=["']root["'][^>]*>/i.exec(template);
  if (!start || start.index == null) return template;
  const tokens = /<div\b[^>]*>|<\/div\s*>/gi;
  tokens.lastIndex = start.index + start[0].length;
  let depth = 1;
  for (let match = tokens.exec(template); match; match = tokens.exec(template)) {
    depth += /^<\//.test(match[0]) ? -1 : 1;
    if (!depth) return template.slice(0, start.index) + `<div id="root">${body}</div>` + template.slice(tokens.lastIndex);
  }
  return template;
}
