import {describe,it,expect} from 'vitest';
import {analyticsCspOrigin} from './analyticsCsp';
describe('analytics CSP destination',()=>{
 it('adds only the configured HTTPS origin',()=>{
  expect(analyticsCspOrigin('https://analytics.example.test/path')).toEqual(['https://analytics.example.test']);
 });
 it('fails closed for absent placeholders malformed protocols credentials ports and wildcards',()=>{
  for(const x of [undefined,'%VITE_ANALYTICS_ENDPOINT%','javascript:alert(1)','http://analytics.example.test','https://user:secret@analytics.example.test','https://analytics.example.test:8443','https://*.example.test','broken'])expect(analyticsCspOrigin(x)).toEqual([]);
 });
});
