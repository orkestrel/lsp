# H3 claim 2 — the mechanical WHATWG diff (2026-08-26)

Instrument: the WHATWG HTML parsing section fetched on the host
(`https://html.spec.whatwg.org/multipage/parsing.html`, 785,988 bytes on 2026-08-26), with
the special-element list and the scope definitions extracted from the fetched markup and
diffed against the `IMPLIED_BARRIERS` rows in `/home/user/html/src/core/constants.ts`. The
fetched authority readings:

- Base scope ("has an element in scope", HTML namespace): `applet`, `caption`, `html`,
  `table`, `td`, `th`, `marquee`, `object`, `select`, `template`, plus the MathML and SVG
  integration points this AST omits. The living standard's base list carries `select`.
- List item scope: the base list plus `ol` and `ul`.
- Button scope: the base list plus `button`.
- Table scope: `html`, `table`, `template`.
- Special: `address applet area article aside base basefont bgsound blockquote body br
  button caption center col colgroup dd details dir div dl dt embed fieldset figcaption
  figure footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html iframe
  img input keygen li link listing main marquee menu meta nav noembed noframes noscript
  object ol p param plaintext pre script search section select source style summary table
  tbody td template textarea tfoot th thead title tr track ul wbr xmp` plus the MathML and
  SVG points.

The comparison script, run in `/home/user/html`:

```python
import re
src = open('src/core/constants.ts').read()
m = re.search(r'export const IMPLIED_BARRIERS[^=]*=\s*Object\.freeze\(\{(.*?)\n\}\)', src, re.S)
rows = {}
for rm in re.finditer(r"(\w+):\s*Object\.freeze\(\[(.*?)\]\)", m.group(1), re.S):
    rows[rm.group(1)] = sorted(re.findall(r"'([^']+)'", rm.group(2)))
special = set("""address applet area article aside base basefont bgsound blockquote body br button caption center col colgroup dd details dir div dl dt embed fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html iframe img input keygen li link listing main marquee menu meta nav noembed noframes noscript object ol p param plaintext pre script search section select source style summary table tbody td template textarea tfoot th thead title tr track ul wbr xmp""".split())
base_scope = set("applet caption html table td th marquee object select template".split())
button_scope = base_scope | {'button'}
table_scope = {'html', 'table', 'template'}
void = set("area base br col embed hr img input link meta source track wbr".split())
raw = {'script', 'style'}
literal = {'textarea', 'title'}
passthru = {'address', 'div', 'p'}
def diff(name, expected, exclusions):
    have = set(rows.get(name, []))
    print(name, sorted(expected - have - exclusions), sorted(have - expected))
diff('p', button_scope, {'caption', 'table', 'td', 'th'})
for key, own in [('li', {'li'}), ('dt', {'dt', 'dd'}), ('dd', {'dt', 'dd'})]:
    diff(key, special, passthru | void | raw | literal | own)
for key in ['td', 'th', 'tr', 'thead', 'tbody', 'tfoot']:
    diff(key, table_scope, set())
```

The output, verbatim: every row prints two empty lists — no member missing beyond the
recorded exclusion categories, no member beyond the authority. The `option` and `optgroup`
rows read `['select']` and the `rt` and `rp` rows read `['ruby']`, the recorded
insertion-mode adaptations.

Ruling and consequences: see `h3-claim-rulings.md` — the derivation claim holds; the
`html` departure clause and the `select` membership clause are owed to the TSDoc and are
carried by the H3.1 brief.
