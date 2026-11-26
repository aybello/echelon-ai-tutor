import {describe,expect,it} from 'vitest';
import {replaceAppRoot} from './replaceAppRoot';
import {enableFontStylesheet} from '../client/src/lib/fontStylesheet';
describe('balanced application mount replacement',()=>{
  it('handles minimal empty roots with no script lookahead',()=>expect(replaceAppRoot('<body><div id="root"></div></body>','<article>Reviewed $1 copy</article>')).toBe('<body><div id="root"><article>Reviewed $1 copy</article></div></body>'));
  it('replaces complete nested shells and preserves suffix scripts',()=>{
    const input='<body><div id="root"><div><div>Loading</div><nav>Navigation</nav></div></div><!-- analytics --><script>after()</script></body>';
    expect(replaceAppRoot(input,'<article>Post</article>')).toBe('<body><div id="root"><article>Post</article></div><!-- analytics --><script>after()</script></body>');
  });
  it('does not guess on a missing or unclosed mount',()=>{
    for(const input of ['<body>No mount</body>','<div id="root"><div>Unclosed'])expect(replaceAppRoot(input,'new')).toBe(input);
  });
});
describe('CSP-compatible font preload',()=>{
  it('promotes only the known stylesheet preload',()=>{
    const link={tagName:'LINK',rel:'preload',getAttribute:(x:string)=>x==='as'?'style':null};
    enableFontStylesheet({getElementById:(x:string)=>x==='echelon-font-style'?link:null} as unknown as Document);
    expect(link.rel).toBe('stylesheet');
  });
  it('does not require or inject an inline event handler',()=>{
    expect(()=>enableFontStylesheet({getElementById:()=>null} as unknown as Document)).not.toThrow();
  });
});
