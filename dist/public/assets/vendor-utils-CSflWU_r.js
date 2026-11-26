import{r as w,R as Xt}from"./vendor-trpc-H5A0iCft.js";import{r as Qt}from"./vendor-react-Bp6u2mHk.js";var Yt=(function(){function e(){this.keyToValue=new Map,this.valueToKey=new Map}return e.prototype.set=function(t,r){this.keyToValue.set(t,r),this.valueToKey.set(r,t)},e.prototype.getByKey=function(t){return this.keyToValue.get(t)},e.prototype.getByValue=function(t){return this.valueToKey.get(t)},e.prototype.clear=function(){this.keyToValue.clear(),this.valueToKey.clear()},e})(),pt=(function(){function e(t){this.generateIdentifier=t,this.kv=new Yt}return e.prototype.register=function(t,r){this.kv.getByValue(t)||(r||(r=this.generateIdentifier(t)),this.kv.set(r,t))},e.prototype.clear=function(){this.kv.clear()},e.prototype.getIdentifier=function(t){return this.kv.getByValue(t)},e.prototype.getValue=function(t){return this.kv.getByKey(t)},e})(),Jt=(function(){var e=function(t,r){return e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(n,a){n.__proto__=a}||function(n,a){for(var o in a)Object.prototype.hasOwnProperty.call(a,o)&&(n[o]=a[o])},e(t,r)};return function(t,r){if(typeof r!="function"&&r!==null)throw new TypeError("Class extends value "+String(r)+" is not a constructor or null");e(t,r);function n(){this.constructor=t}t.prototype=r===null?Object.create(r):(n.prototype=r.prototype,new n)}})(),er=(function(e){Jt(t,e);function t(){var r=e.call(this,function(n){return n.name})||this;return r.classToAllowedProps=new Map,r}return t.prototype.register=function(r,n){typeof n=="object"?(n.allowProps&&this.classToAllowedProps.set(r,n.allowProps),e.prototype.register.call(this,r,n.identifier)):e.prototype.register.call(this,r,n)},t.prototype.getAllowedProps=function(r){return this.classToAllowedProps.get(r)},t})(pt),tr=function(e,t){var r=typeof Symbol=="function"&&e[Symbol.iterator];if(!r)return e;var n=r.call(e),a,o=[],s;try{for(;(t===void 0||t-- >0)&&!(a=n.next()).done;)o.push(a.value)}catch(l){s={error:l}}finally{try{a&&!a.done&&(r=n.return)&&r.call(n)}finally{if(s)throw s.error}}return o};function rr(e){if("values"in Object)return Object.values(e);var t=[];for(var r in e)e.hasOwnProperty(r)&&t.push(e[r]);return t}function nr(e,t){var r=rr(e);if("find"in r)return r.find(t);for(var n=r,a=0;a<n.length;a++){var o=n[a];if(t(o))return o}}function J(e,t){Object.entries(e).forEach(function(r){var n=tr(r,2),a=n[0],o=n[1];return t(o,a)})}function pe(e,t){return e.indexOf(t)!==-1}function Ze(e,t){for(var r=0;r<e.length;r++){var n=e[r];if(t(n))return n}}var ar=(function(){function e(){this.transfomers={}}return e.prototype.register=function(t){this.transfomers[t.name]=t},e.prototype.findApplicable=function(t){return nr(this.transfomers,function(r){return r.isApplicable(t)})},e.prototype.findByName=function(t){return this.transfomers[t]},e})(),or=function(e){return Object.prototype.toString.call(e).slice(8,-1)},yt=function(e){return typeof e>"u"},sr=function(e){return e===null},re=function(e){return typeof e!="object"||e===null||e===Object.prototype?!1:Object.getPrototypeOf(e)===null?!0:Object.getPrototypeOf(e)===Object.prototype},ze=function(e){return re(e)&&Object.keys(e).length===0},U=function(e){return Array.isArray(e)},ir=function(e){return typeof e=="string"},lr=function(e){return typeof e=="number"&&!isNaN(e)},cr=function(e){return typeof e=="boolean"},dr=function(e){return e instanceof RegExp},ne=function(e){return e instanceof Map},ae=function(e){return e instanceof Set},ft=function(e){return or(e)==="Symbol"},ur=function(e){return e instanceof Date&&!isNaN(e.valueOf())},hr=function(e){return e instanceof Error},Xe=function(e){return typeof e=="number"&&isNaN(e)},pr=function(e){return cr(e)||sr(e)||yt(e)||lr(e)||ir(e)||ft(e)},yr=function(e){return typeof e=="bigint"},fr=function(e){return e===1/0||e===-1/0},mr=function(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)},kr=function(e){return e instanceof URL},mt=function(e){return e.replace(/\./g,"\\.")},xe=function(e){return e.map(String).map(mt).join(".")},te=function(e){for(var t=[],r="",n=0;n<e.length;n++){var a=e.charAt(n),o=a==="\\"&&e.charAt(n+1)===".";if(o){r+=".",n++;continue}var s=a===".";if(s){t.push(r),r="";continue}r+=a}var l=r;return t.push(l),t},Se=function(){return Se=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++){t=arguments[r];for(var a in t)Object.prototype.hasOwnProperty.call(t,a)&&(e[a]=t[a])}return e},Se.apply(this,arguments)},Ae=function(e,t){var r=typeof Symbol=="function"&&e[Symbol.iterator];if(!r)return e;var n=r.call(e),a,o=[],s;try{for(;(t===void 0||t-- >0)&&!(a=n.next()).done;)o.push(a.value)}catch(l){s={error:l}}finally{try{a&&!a.done&&(r=n.return)&&r.call(n)}finally{if(s)throw s.error}}return o},Re=function(e,t){for(var r=0,n=t.length,a=e.length;r<n;r++,a++)e[a]=t[r];return e};function O(e,t,r,n){return{isApplicable:e,annotation:t,transform:r,untransform:n}}var kt=[O(yt,"undefined",function(){return null},function(){}),O(yr,"bigint",function(e){return e.toString()},function(e){return typeof BigInt<"u"?BigInt(e):(console.error("Please add a BigInt polyfill."),e)}),O(ur,"Date",function(e){return e.toISOString()},function(e){return new Date(e)}),O(hr,"Error",function(e,t){var r={name:e.name,message:e.message};return t.allowedErrorProps.forEach(function(n){r[n]=e[n]}),r},function(e,t){var r=new Error(e.message);return r.name=e.name,r.stack=e.stack,t.allowedErrorProps.forEach(function(n){r[n]=e[n]}),r}),O(dr,"regexp",function(e){return""+e},function(e){var t=e.slice(1,e.lastIndexOf("/")),r=e.slice(e.lastIndexOf("/")+1);return new RegExp(t,r)}),O(ae,"set",function(e){return Re([],Ae(e.values()))},function(e){return new Set(e)}),O(ne,"map",function(e){return Re([],Ae(e.entries()))},function(e){return new Map(e)}),O(function(e){return Xe(e)||fr(e)},"number",function(e){return Xe(e)?"NaN":e>0?"Infinity":"-Infinity"},Number),O(function(e){return e===0&&1/e===-1/0},"number",function(){return"-0"},Number),O(kr,"URL",function(e){return e.toString()},function(e){return new URL(e)})];function fe(e,t,r,n){return{isApplicable:e,annotation:t,transform:r,untransform:n}}var gt=fe(function(e,t){if(ft(e)){var r=!!t.symbolRegistry.getIdentifier(e);return r}return!1},function(e,t){var r=t.symbolRegistry.getIdentifier(e);return["symbol",r]},function(e){return e.description},function(e,t,r){var n=r.symbolRegistry.getValue(t[1]);if(!n)throw new Error("Trying to deserialize unknown symbol");return n}),gr=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,Uint8ClampedArray].reduce(function(e,t){return e[t.name]=t,e},{}),bt=fe(mr,function(e){return["typed-array",e.constructor.name]},function(e){return Re([],Ae(e))},function(e,t){var r=gr[t[1]];if(!r)throw new Error("Trying to deserialize unknown typed array");return new r(e)});function vt(e,t){if(e?.constructor){var r=!!t.classRegistry.getIdentifier(e.constructor);return r}return!1}var xt=fe(vt,function(e,t){var r=t.classRegistry.getIdentifier(e.constructor);return["class",r]},function(e,t){var r=t.classRegistry.getAllowedProps(e.constructor);if(!r)return Se({},e);var n={};return r.forEach(function(a){n[a]=e[a]}),n},function(e,t,r){var n=r.classRegistry.getValue(t[1]);if(!n)throw new Error("Trying to deserialize unknown class - check https://github.com/blitz-js/superjson/issues/116#issuecomment-773996564");return Object.assign(Object.create(n.prototype),e)}),wt=fe(function(e,t){return!!t.customTransformerRegistry.findApplicable(e)},function(e,t){var r=t.customTransformerRegistry.findApplicable(e);return["custom",r.name]},function(e,t){var r=t.customTransformerRegistry.findApplicable(e);return r.serialize(e)},function(e,t,r){var n=r.customTransformerRegistry.findByName(t[1]);if(!n)throw new Error("Trying to deserialize unknown custom value");return n.deserialize(e)}),br=[xt,gt,wt,bt],Qe=function(e,t){var r=Ze(br,function(a){return a.isApplicable(e,t)});if(r)return{value:r.transform(e,t),type:r.annotation(e,t)};var n=Ze(kt,function(a){return a.isApplicable(e,t)});if(n)return{value:n.transform(e,t),type:n.annotation}},Mt={};kt.forEach(function(e){Mt[e.annotation]=e});var vr=function(e,t,r){if(U(t))switch(t[0]){case"symbol":return gt.untransform(e,t,r);case"class":return xt.untransform(e,t,r);case"custom":return wt.untransform(e,t,r);case"typed-array":return bt.untransform(e,t,r);default:throw new Error("Unknown transformation: "+t)}else{var n=Mt[t];if(!n)throw new Error("Unknown transformation: "+t);return n.untransform(e,r)}},Y=function(e,t){for(var r=e.keys();t>0;)r.next(),t--;return r.next().value};function Ct(e){if(pe(e,"__proto__"))throw new Error("__proto__ is not allowed as a property");if(pe(e,"prototype"))throw new Error("prototype is not allowed as a property");if(pe(e,"constructor"))throw new Error("constructor is not allowed as a property")}var xr=function(e,t){Ct(t);for(var r=0;r<t.length;r++){var n=t[r];if(ae(e))e=Y(e,+n);else if(ne(e)){var a=+n,o=+t[++r]==0?"key":"value",s=Y(e,a);switch(o){case"key":e=s;break;case"value":e=e.get(s);break}}else e=e[n]}return e},Ee=function(e,t,r){if(Ct(t),t.length===0)return r(e);for(var n=e,a=0;a<t.length-1;a++){var o=t[a];if(U(n)){var s=+o;n=n[s]}else if(re(n))n=n[o];else if(ae(n)){var l=+o;n=Y(n,l)}else if(ne(n)){var h=a===t.length-2;if(h)break;var l=+o,c=+t[++a]==0?"key":"value",f=Y(n,l);switch(c){case"key":n=f;break;case"value":n=n.get(f);break}}}var y=t[t.length-1];if(U(n)?n[+y]=r(n[+y]):re(n)&&(n[y]=r(n[y])),ae(n)){var k=Y(n,+y),x=r(k);k!==x&&(n.delete(k),n.add(x))}if(ne(n)){var l=+t[t.length-2],M=Y(n,l),c=+y==0?"key":"value";switch(c){case"key":{var b=r(M);n.set(b,n.get(M)),b!==M&&n.delete(M);break}case"value":{n.set(M,r(n.get(M)));break}}}return e},T=function(e,t){var r=typeof Symbol=="function"&&e[Symbol.iterator];if(!r)return e;var n=r.call(e),a,o=[],s;try{for(;(t===void 0||t-- >0)&&!(a=n.next()).done;)o.push(a.value)}catch(l){s={error:l}}finally{try{a&&!a.done&&(r=n.return)&&r.call(n)}finally{if(s)throw s.error}}return o},H=function(e,t){for(var r=0,n=t.length,a=e.length;r<n;r++,a++)e[a]=t[r];return e};function Pe(e,t,r){if(r===void 0&&(r=[]),!!e){if(!U(e)){J(e,function(s,l){return Pe(s,t,H(H([],T(r)),T(te(l))))});return}var n=T(e,2),a=n[0],o=n[1];o&&J(o,function(s,l){Pe(s,t,H(H([],T(r)),T(te(l))))}),t(a,r)}}function wr(e,t,r){return Pe(t,function(n,a){e=Ee(e,a,function(o){return vr(o,n,r)})}),e}function Mr(e,t){function r(s,l){var h=xr(e,te(l));s.map(te).forEach(function(c){e=Ee(e,c,function(){return h})})}if(U(t)){var n=T(t,2),a=n[0],o=n[1];a.forEach(function(s){e=Ee(e,te(s),function(){return e})}),o&&J(o,r)}else J(t,r);return e}var Cr=function(e,t){return re(e)||U(e)||ne(e)||ae(e)||vt(e,t)};function zr(e,t,r){var n=r.get(e);n?n.push(t):r.set(e,[t])}function Sr(e,t){var r={},n=void 0;return e.forEach(function(a){if(!(a.length<=1)){t||(a=a.map(function(h){return h.map(String)}).sort(function(h,c){return h.length-c.length}));var o=T(a),s=o[0],l=o.slice(1);s.length===0?n=l.map(xe):r[xe(s)]=l.map(xe)}}),n?ze(r)?[n]:[n,r]:ze(r)?void 0:r}var zt=function(e,t,r,n,a,o,s){var l;a===void 0&&(a=[]),o===void 0&&(o=[]),s===void 0&&(s=new Map);var h=pr(e);if(!h){zr(e,a,t);var c=s.get(e);if(c)return n?{transformedValue:null}:c}if(!Cr(e,r)){var f=Qe(e,r),y=f?{transformedValue:f.value,annotations:[f.type]}:{transformedValue:e};return h||s.set(e,y),y}if(pe(o,e))return{transformedValue:null};var k=Qe(e,r),x=(l=k?.value)!==null&&l!==void 0?l:e,M=U(x)?[]:{},b={};J(x,function(V,z){var P=zt(V,t,r,n,H(H([],T(a)),[z]),H(H([],T(o)),[e]),s);M[z]=P.transformedValue,U(P.annotations)?b[z]=P.annotations:re(P.annotations)&&J(P.annotations,function(j,N){b[mt(z)+"."+N]=j})});var v=ze(b)?{transformedValue:M,annotations:k?[k.type]:void 0}:{transformedValue:M,annotations:k?[k.type,b]:b};return h||s.set(e,v),v};function St(e){return Object.prototype.toString.call(e).slice(8,-1)}function Ye(e){return St(e)==="Array"}function Ar(e){if(St(e)!=="Object")return!1;const t=Object.getPrototypeOf(e);return!!t&&t.constructor===Object&&t===Object.prototype}function Rr(e,t,r,n,a){const o={}.propertyIsEnumerable.call(n,t)?"enumerable":"nonenumerable";o==="enumerable"&&(e[t]=r),a&&o==="nonenumerable"&&Object.defineProperty(e,t,{value:r,enumerable:!1,writable:!0,configurable:!0})}function Le(e,t={}){if(Ye(e))return e.map(a=>Le(a,t));if(!Ar(e))return e;const r=Object.getOwnPropertyNames(e),n=Object.getOwnPropertySymbols(e);return[...r,...n].reduce((a,o)=>{if(Ye(t.props)&&!t.props.includes(o))return a;const s=e[o],l=Le(s,t);return Rr(a,o,l,e,t.nonenumerable),a},{})}var K=function(){return K=Object.assign||function(e){for(var t,r=1,n=arguments.length;r<n;r++){t=arguments[r];for(var a in t)Object.prototype.hasOwnProperty.call(t,a)&&(e[a]=t[a])}return e},K.apply(this,arguments)},Er=function(e,t){var r=typeof Symbol=="function"&&e[Symbol.iterator];if(!r)return e;var n=r.call(e),a,o=[],s;try{for(;(t===void 0||t-- >0)&&!(a=n.next()).done;)o.push(a.value)}catch(l){s={error:l}}finally{try{a&&!a.done&&(r=n.return)&&r.call(n)}finally{if(s)throw s.error}}return o},Pr=function(e,t){for(var r=0,n=t.length,a=e.length;r<n;r++,a++)e[a]=t[r];return e},G=(function(){function e(t){var r=t===void 0?{}:t,n=r.dedupe,a=n===void 0?!1:n;this.classRegistry=new er,this.symbolRegistry=new pt(function(o){var s;return(s=o.description)!==null&&s!==void 0?s:""}),this.customTransformerRegistry=new ar,this.allowedErrorProps=[],this.dedupe=a}return e.prototype.serialize=function(t){var r=new Map,n=zt(t,r,this,this.dedupe),a={json:n.transformedValue};n.annotations&&(a.meta=K(K({},a.meta),{values:n.annotations}));var o=Sr(r,this.dedupe);return o&&(a.meta=K(K({},a.meta),{referentialEqualities:o})),a},e.prototype.deserialize=function(t){var r=t.json,n=t.meta,a=Le(r);return n?.values&&(a=wr(a,n.values,this)),n?.referentialEqualities&&(a=Mr(a,n.referentialEqualities)),a},e.prototype.stringify=function(t){return JSON.stringify(this.serialize(t))},e.prototype.parse=function(t){return this.deserialize(JSON.parse(t))},e.prototype.registerClass=function(t,r){this.classRegistry.register(t,r)},e.prototype.registerSymbol=function(t,r){this.symbolRegistry.register(t,r)},e.prototype.registerCustom=function(t,r){this.customTransformerRegistry.register(K({name:r},t))},e.prototype.allowErrorProps=function(){for(var t,r=[],n=0;n<arguments.length;n++)r[n]=arguments[n];(t=this.allowedErrorProps).push.apply(t,Pr([],Er(r)))},e.defaultInstance=new e,e.serialize=e.defaultInstance.serialize.bind(e.defaultInstance),e.deserialize=e.defaultInstance.deserialize.bind(e.defaultInstance),e.stringify=e.defaultInstance.stringify.bind(e.defaultInstance),e.parse=e.defaultInstance.parse.bind(e.defaultInstance),e.registerClass=e.defaultInstance.registerClass.bind(e.defaultInstance),e.registerSymbol=e.defaultInstance.registerSymbol.bind(e.defaultInstance),e.registerCustom=e.defaultInstance.registerCustom.bind(e.defaultInstance),e.allowErrorProps=e.defaultInstance.allowErrorProps.bind(e.defaultInstance),e})();G.serialize;G.deserialize;G.stringify;G.parse;G.registerClass;G.registerCustom;G.registerSymbol;G.allowErrorProps;function At(e){var t,r,n="";if(typeof e=="string"||typeof e=="number")n+=e;else if(typeof e=="object")if(Array.isArray(e)){var a=e.length;for(t=0;t<a;t++)e[t]&&(r=At(e[t]))&&(n&&(n+=" "),n+=r)}else for(r in e)e[r]&&(n&&(n+=" "),n+=r);return n}function Lr(){for(var e,t,r=0,n="",a=arguments.length;r<a;r++)(e=arguments[r])&&(t=At(e))&&(n&&(n+=" "),n+=t);return n}const Or=(e,t)=>{const r=new Array(e.length+t.length);for(let n=0;n<e.length;n++)r[n]=e[n];for(let n=0;n<t.length;n++)r[e.length+n]=t[n];return r},_r=(e,t)=>({classGroupId:e,validator:t}),Rt=(e=new Map,t=null,r)=>({nextPart:e,validators:t,classGroupId:r}),ye="-",Je=[],Vr="arbitrary..",Ir=e=>{const t=Tr(e),{conflictingClassGroups:r,conflictingClassGroupModifiers:n}=e;return{getClassGroupId:s=>{if(s.startsWith("[")&&s.endsWith("]"))return qr(s);const l=s.split(ye),h=l[0]===""&&l.length>1?1:0;return Et(l,h,t)},getConflictingClassGroupIds:(s,l)=>{if(l){const h=n[s],c=r[s];return h?c?Or(c,h):h:c||Je}return r[s]||Je}}},Et=(e,t,r)=>{if(e.length-t===0)return r.classGroupId;const a=e[t],o=r.nextPart.get(a);if(o){const c=Et(e,t+1,o);if(c)return c}const s=r.validators;if(s===null)return;const l=t===0?e.join(ye):e.slice(t).join(ye),h=s.length;for(let c=0;c<h;c++){const f=s[c];if(f.validator(l))return f.classGroupId}},qr=e=>e.slice(1,-1).indexOf(":")===-1?void 0:(()=>{const t=e.slice(1,-1),r=t.indexOf(":"),n=t.slice(0,r);return n?Vr+n:void 0})(),Tr=e=>{const{theme:t,classGroups:r}=e;return jr(r,t)},jr=(e,t)=>{const r=Rt();for(const n in e){const a=e[n];Ie(a,r,n,t)}return r},Ie=(e,t,r,n)=>{const a=e.length;for(let o=0;o<a;o++){const s=e[o];Nr(s,t,r,n)}},Nr=(e,t,r,n)=>{if(typeof e=="string"){Br(e,t,r);return}if(typeof e=="function"){Hr(e,t,r,n);return}Ur(e,t,r,n)},Br=(e,t,r)=>{const n=e===""?t:Pt(t,e);n.classGroupId=r},Hr=(e,t,r,n)=>{if(Gr(e)){Ie(e(n),t,r,n);return}t.validators===null&&(t.validators=[]),t.validators.push(_r(r,e))},Ur=(e,t,r,n)=>{const a=Object.entries(e),o=a.length;for(let s=0;s<o;s++){const[l,h]=a[s];Ie(h,Pt(t,l),r,n)}},Pt=(e,t)=>{let r=e;const n=t.split(ye),a=n.length;for(let o=0;o<a;o++){const s=n[o];let l=r.nextPart.get(s);l||(l=Rt(),r.nextPart.set(s,l)),r=l}return r},Gr=e=>"isThemeGetter"in e&&e.isThemeGetter===!0,Dr=e=>{if(e<1)return{get:()=>{},set:()=>{}};let t=0,r=Object.create(null),n=Object.create(null);const a=(o,s)=>{r[o]=s,t++,t>e&&(t=0,n=r,r=Object.create(null))};return{get(o){let s=r[o];if(s!==void 0)return s;if((s=n[o])!==void 0)return a(o,s),s},set(o,s){o in r?r[o]=s:a(o,s)}}},Oe="!",et=":",Fr=[],tt=(e,t,r,n,a)=>({modifiers:e,hasImportantModifier:t,baseClassName:r,maybePostfixModifierPosition:n,isExternal:a}),Wr=e=>{const{prefix:t,experimentalParseClassName:r}=e;let n=a=>{const o=[];let s=0,l=0,h=0,c;const f=a.length;for(let b=0;b<f;b++){const v=a[b];if(s===0&&l===0){if(v===et){o.push(a.slice(h,b)),h=b+1;continue}if(v==="/"){c=b;continue}}v==="["?s++:v==="]"?s--:v==="("?l++:v===")"&&l--}const y=o.length===0?a:a.slice(h);let k=y,x=!1;y.endsWith(Oe)?(k=y.slice(0,-1),x=!0):y.startsWith(Oe)&&(k=y.slice(1),x=!0);const M=c&&c>h?c-h:void 0;return tt(o,x,k,M)};if(t){const a=t+et,o=n;n=s=>s.startsWith(a)?o(s.slice(a.length)):tt(Fr,!1,s,void 0,!0)}if(r){const a=n;n=o=>r({className:o,parseClassName:a})}return n},$r=e=>{const t=new Map;return e.orderSensitiveModifiers.forEach((r,n)=>{t.set(r,1e6+n)}),r=>{const n=[];let a=[];for(let o=0;o<r.length;o++){const s=r[o],l=s[0]==="[",h=t.has(s);l||h?(a.length>0&&(a.sort(),n.push(...a),a=[]),n.push(s)):a.push(s)}return a.length>0&&(a.sort(),n.push(...a)),n}},Kr=e=>({cache:Dr(e.cacheSize),parseClassName:Wr(e),sortModifiers:$r(e),postfixLookupClassGroupIds:Zr(e),...Ir(e)}),Zr=e=>{const t=Object.create(null),r=e.postfixLookupClassGroups;if(r)for(let n=0;n<r.length;n++)t[r[n]]=!0;return t},Xr=/\s+/,Qr=(e,t)=>{const{parseClassName:r,getClassGroupId:n,getConflictingClassGroupIds:a,sortModifiers:o,postfixLookupClassGroupIds:s}=t,l=[],h=e.trim().split(Xr);let c="";for(let f=h.length-1;f>=0;f-=1){const y=h[f],{isExternal:k,modifiers:x,hasImportantModifier:M,baseClassName:b,maybePostfixModifierPosition:v}=r(y);if(k){c=y+(c.length>0?" "+c:c);continue}let V=!!v,z;if(V){const I=b.substring(0,v);z=n(I);const p=z&&s[z]?n(b):void 0;p&&p!==z&&(z=p,V=!1)}else z=n(b);if(!z){if(!V){c=y+(c.length>0?" "+c:c);continue}if(z=n(b),!z){c=y+(c.length>0?" "+c:c);continue}V=!1}const P=x.length===0?"":x.length===1?x[0]:o(x).join(":"),j=M?P+Oe:P,N=j+z;if(l.indexOf(N)>-1)continue;l.push(N);const X=a(z,V);for(let I=0;I<X.length;++I){const p=X[I];l.push(j+p)}c=y+(c.length>0?" "+c:c)}return c},Yr=(...e)=>{let t=0,r,n,a="";for(;t<e.length;)(r=e[t++])&&(n=Lt(r))&&(a&&(a+=" "),a+=n);return a},Lt=e=>{if(typeof e=="string")return e;let t,r="";for(let n=0;n<e.length;n++)e[n]&&(t=Lt(e[n]))&&(r&&(r+=" "),r+=t);return r},Jr=(e,...t)=>{let r,n,a,o;const s=h=>{const c=t.reduce((f,y)=>y(f),e());return r=Kr(c),n=r.cache.get,a=r.cache.set,o=l,l(h)},l=h=>{const c=n(h);if(c)return c;const f=Qr(h,r);return a(h,f),f};return o=s,(...h)=>o(Yr(...h))},en=[],C=e=>{const t=r=>r[e]||en;return t.isThemeGetter=!0,t.themeKey=e,t},Ot=/^\[(?:(\w[\w-]*):)?(.+)\]$/i,_t=/^\((?:(\w[\w-]*):)?(.+)\)$/i,tn=/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,rn=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,nn=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,an=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix|color|light-dark)\(.+\)$/,on=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,sn=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,B=e=>tn.test(e),g=e=>!!e&&!Number.isNaN(Number(e)),_=e=>!!e&&Number.isInteger(Number(e)),we=e=>e.endsWith("%")&&g(e.slice(0,-1)),q=e=>rn.test(e),Vt=()=>!0,ln=e=>nn.test(e)&&!an.test(e),qe=()=>!1,cn=e=>on.test(e),dn=e=>sn.test(e),un=e=>!d(e)&&!u(e),hn=e=>e.startsWith("@container")&&(e[10]==="/"&&e[11]!==void 0||e[11]==="s"&&e[16]!==void 0&&e.startsWith("-size/",10)||e[11]==="n"&&e[18]!==void 0&&e.startsWith("-normal/",10)),pn=e=>D(e,Tt,qe),d=e=>Ot.test(e),$=e=>D(e,jt,ln),rt=e=>D(e,xn,g),yn=e=>D(e,Bt,Vt),fn=e=>D(e,Nt,qe),nt=e=>D(e,It,qe),mn=e=>D(e,qt,dn),ue=e=>D(e,Ht,cn),u=e=>_t.test(e),ee=e=>Z(e,jt),kn=e=>Z(e,Nt),at=e=>Z(e,It),gn=e=>Z(e,Tt),bn=e=>Z(e,qt),he=e=>Z(e,Ht,!0),vn=e=>Z(e,Bt,!0),D=(e,t,r)=>{const n=Ot.exec(e);return n?n[1]?t(n[1]):r(n[2]):!1},Z=(e,t,r=!1)=>{const n=_t.exec(e);return n?n[1]?t(n[1]):r:!1},It=e=>e==="position"||e==="percentage",qt=e=>e==="image"||e==="url",Tt=e=>e==="length"||e==="size"||e==="bg-size",jt=e=>e==="length",xn=e=>e==="number",Nt=e=>e==="family-name",Bt=e=>e==="number"||e==="weight",Ht=e=>e==="shadow",wn=()=>{const e=C("color"),t=C("font"),r=C("text"),n=C("font-weight"),a=C("tracking"),o=C("leading"),s=C("breakpoint"),l=C("container"),h=C("spacing"),c=C("radius"),f=C("shadow"),y=C("inset-shadow"),k=C("text-shadow"),x=C("drop-shadow"),M=C("blur"),b=C("perspective"),v=C("aspect"),V=C("ease"),z=C("animate"),P=()=>["auto","avoid","all","avoid-page","page","left","right","column"],j=()=>["center","top","bottom","left","right","top-left","left-top","top-right","right-top","bottom-right","right-bottom","bottom-left","left-bottom"],N=()=>[...j(),u,d],X=()=>["auto","hidden","clip","visible","scroll"],I=()=>["auto","contain","none"],p=()=>[u,d,h],E=()=>[B,"full","auto",...p()],He=()=>[_,"none","subgrid",u,d],Ue=()=>["auto",{span:["full",_,u,d]},_,u,d],se=()=>[_,"auto",u,d],Ge=()=>["auto","min","max","fr",u,d],me=()=>["start","end","center","between","around","evenly","stretch","baseline","center-safe","end-safe"],Q=()=>["start","end","center","stretch","center-safe","end-safe"],L=()=>["auto",...p()],W=()=>[B,"auto","full","dvw","dvh","lvw","lvh","svw","svh","min","max","fit",...p()],ke=()=>[l,B,"screen","full","dvw","lvw","svw","min","max","fit",...p()],ge=()=>[B,"screen","full","lh","dvh","lvh","svh","min","max","fit",...p()],m=()=>[e,u,d],De=()=>[...j(),at,nt,{position:[u,d]}],Fe=()=>["no-repeat",{repeat:["","x","y","space","round"]}],We=()=>["auto","cover","contain",gn,pn,{size:[u,d]}],be=()=>[we,ee,$],A=()=>["","none","full",c,u,d],R=()=>["",g,ee,$],ie=()=>["solid","dashed","dotted","double"],$e=()=>["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"],S=()=>[g,we,at,nt],Ke=()=>["","none",M,u,d],le=()=>["none",g,u,d],ce=()=>["none",g,u,d],ve=()=>[g,u,d],de=()=>[B,"full",...p()];return{cacheSize:500,theme:{animate:["spin","ping","pulse","bounce"],aspect:["video"],blur:[q],breakpoint:[q],color:[Vt],container:[q],"drop-shadow":[q],ease:["in","out","in-out"],font:[un],"font-weight":["thin","extralight","light","normal","medium","semibold","bold","extrabold","black"],"inset-shadow":[q],leading:["none","tight","snug","normal","relaxed","loose"],perspective:["dramatic","near","normal","midrange","distant","none"],radius:[q],shadow:[q],spacing:["px",g],text:[q],"text-shadow":[q],tracking:["tighter","tight","normal","wide","wider","widest"]},classGroups:{aspect:[{aspect:["auto","square",B,d,u,v]}],container:["container"],"container-type":[{"@container":["","normal","size",u,d]}],"container-named":[hn],columns:[{columns:[g,"auto",d,u,l]}],"break-after":[{"break-after":P()}],"break-before":[{"break-before":P()}],"break-inside":[{"break-inside":["auto","avoid","avoid-page","avoid-column"]}],"box-decoration":[{"box-decoration":["slice","clone"]}],box:[{box:["border","content"]}],display:["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row-group","table-row","flow-root","grid","inline-grid","contents","list-item","hidden"],sr:["sr-only","not-sr-only"],float:[{float:["right","left","none","start","end"]}],clear:[{clear:["left","right","both","none","start","end"]}],isolation:["isolate","isolation-auto"],"object-fit":[{object:["contain","cover","fill","none","scale-down"]}],"object-position":[{object:N()}],overflow:[{overflow:X()}],"overflow-x":[{"overflow-x":X()}],"overflow-y":[{"overflow-y":X()}],overscroll:[{overscroll:I()}],"overscroll-x":[{"overscroll-x":I()}],"overscroll-y":[{"overscroll-y":I()}],position:["static","fixed","absolute","relative","sticky"],inset:[{inset:E()}],"inset-x":[{"inset-x":E()}],"inset-y":[{"inset-y":E()}],start:[{"inset-s":E(),start:E()}],end:[{"inset-e":E(),end:E()}],"inset-bs":[{"inset-bs":E()}],"inset-be":[{"inset-be":E()}],top:[{top:E()}],right:[{right:E()}],bottom:[{bottom:E()}],left:[{left:E()}],visibility:["visible","invisible","collapse"],z:[{z:[_,"auto",u,d]}],basis:[{basis:[B,"full","auto",l,...p()]}],"flex-direction":[{flex:["row","row-reverse","col","col-reverse"]}],"flex-wrap":[{flex:["nowrap","wrap","wrap-reverse"]}],flex:[{flex:[g,B,"auto","initial","none",d]}],grow:[{grow:["",g,u,d]}],shrink:[{shrink:["",g,u,d]}],order:[{order:[_,"first","last","none",u,d]}],"grid-cols":[{"grid-cols":He()}],"col-start-end":[{col:Ue()}],"col-start":[{"col-start":se()}],"col-end":[{"col-end":se()}],"grid-rows":[{"grid-rows":He()}],"row-start-end":[{row:Ue()}],"row-start":[{"row-start":se()}],"row-end":[{"row-end":se()}],"grid-flow":[{"grid-flow":["row","col","dense","row-dense","col-dense"]}],"auto-cols":[{"auto-cols":Ge()}],"auto-rows":[{"auto-rows":Ge()}],gap:[{gap:p()}],"gap-x":[{"gap-x":p()}],"gap-y":[{"gap-y":p()}],"justify-content":[{justify:[...me(),"normal"]}],"justify-items":[{"justify-items":[...Q(),"normal"]}],"justify-self":[{"justify-self":["auto",...Q()]}],"align-content":[{content:["normal",...me()]}],"align-items":[{items:[...Q(),{baseline:["","last"]}]}],"align-self":[{self:["auto",...Q(),{baseline:["","last"]}]}],"place-content":[{"place-content":me()}],"place-items":[{"place-items":[...Q(),"baseline"]}],"place-self":[{"place-self":["auto",...Q()]}],p:[{p:p()}],px:[{px:p()}],py:[{py:p()}],ps:[{ps:p()}],pe:[{pe:p()}],pbs:[{pbs:p()}],pbe:[{pbe:p()}],pt:[{pt:p()}],pr:[{pr:p()}],pb:[{pb:p()}],pl:[{pl:p()}],m:[{m:L()}],mx:[{mx:L()}],my:[{my:L()}],ms:[{ms:L()}],me:[{me:L()}],mbs:[{mbs:L()}],mbe:[{mbe:L()}],mt:[{mt:L()}],mr:[{mr:L()}],mb:[{mb:L()}],ml:[{ml:L()}],"space-x":[{"space-x":p()}],"space-x-reverse":["space-x-reverse"],"space-y":[{"space-y":p()}],"space-y-reverse":["space-y-reverse"],size:[{size:W()}],"inline-size":[{inline:["auto",...ke()]}],"min-inline-size":[{"min-inline":["auto",...ke()]}],"max-inline-size":[{"max-inline":["none",...ke()]}],"block-size":[{block:["auto",...ge()]}],"min-block-size":[{"min-block":["auto",...ge()]}],"max-block-size":[{"max-block":["none",...ge()]}],w:[{w:[l,"screen",...W()]}],"min-w":[{"min-w":[l,"screen","none",...W()]}],"max-w":[{"max-w":[l,"screen","none","prose",{screen:[s]},...W()]}],h:[{h:["screen","lh",...W()]}],"min-h":[{"min-h":["screen","lh","none",...W()]}],"max-h":[{"max-h":["screen","lh","none",...W()]}],"font-size":[{text:["base",r,ee,$]}],"font-smoothing":["antialiased","subpixel-antialiased"],"font-style":["italic","not-italic"],"font-weight":[{font:[n,vn,yn]}],"font-stretch":[{"font-stretch":["ultra-condensed","extra-condensed","condensed","semi-condensed","normal","semi-expanded","expanded","extra-expanded","ultra-expanded",we,d]}],"font-family":[{font:[kn,fn,t]}],"font-features":[{"font-features":[d]}],"fvn-normal":["normal-nums"],"fvn-ordinal":["ordinal"],"fvn-slashed-zero":["slashed-zero"],"fvn-figure":["lining-nums","oldstyle-nums"],"fvn-spacing":["proportional-nums","tabular-nums"],"fvn-fraction":["diagonal-fractions","stacked-fractions"],tracking:[{tracking:[a,u,d]}],"line-clamp":[{"line-clamp":[g,"none",u,rt]}],leading:[{leading:["none",o,...p()]}],"list-image":[{"list-image":["none",u,d]}],"list-style-position":[{list:["inside","outside"]}],"list-style-type":[{list:["disc","decimal","none",u,d]}],"text-alignment":[{text:["left","center","right","justify","start","end"]}],"placeholder-color":[{placeholder:m()}],"text-color":[{text:m()}],"text-decoration":["underline","overline","line-through","no-underline"],"text-decoration-style":[{decoration:[...ie(),"wavy"]}],"text-decoration-thickness":[{decoration:[g,"from-font","auto",u,$]}],"text-decoration-color":[{decoration:m()}],"underline-offset":[{"underline-offset":[g,"auto",u,d]}],"text-transform":["uppercase","lowercase","capitalize","normal-case"],"text-overflow":["truncate","text-ellipsis","text-clip"],"text-wrap":[{text:["wrap","nowrap","balance","pretty"]}],indent:[{indent:p()}],"tab-size":[{tab:[_,u,d]}],"vertical-align":[{align:["baseline","top","middle","bottom","text-top","text-bottom","sub","super",u,d]}],whitespace:[{whitespace:["normal","nowrap","pre","pre-line","pre-wrap","break-spaces"]}],break:[{break:["normal","words","all","keep"]}],wrap:[{wrap:["break-word","anywhere","normal"]}],hyphens:[{hyphens:["none","manual","auto"]}],content:[{content:["none",u,d]}],"bg-attachment":[{bg:["fixed","local","scroll"]}],"bg-clip":[{"bg-clip":["border","padding","content","text"]}],"bg-origin":[{"bg-origin":["border","padding","content"]}],"bg-position":[{bg:De()}],"bg-repeat":[{bg:Fe()}],"bg-size":[{bg:We()}],"bg-image":[{bg:["none",{linear:[{to:["t","tr","r","br","b","bl","l","tl"]},_,u,d],radial:["",u,d],conic:["",_,u,d]},bn,mn]}],"bg-color":[{bg:m()}],"gradient-from-pos":[{from:be()}],"gradient-via-pos":[{via:be()}],"gradient-to-pos":[{to:be()}],"gradient-from":[{from:m()}],"gradient-via":[{via:m()}],"gradient-to":[{to:m()}],rounded:[{rounded:A()}],"rounded-s":[{"rounded-s":A()}],"rounded-e":[{"rounded-e":A()}],"rounded-t":[{"rounded-t":A()}],"rounded-r":[{"rounded-r":A()}],"rounded-b":[{"rounded-b":A()}],"rounded-l":[{"rounded-l":A()}],"rounded-ss":[{"rounded-ss":A()}],"rounded-se":[{"rounded-se":A()}],"rounded-ee":[{"rounded-ee":A()}],"rounded-es":[{"rounded-es":A()}],"rounded-tl":[{"rounded-tl":A()}],"rounded-tr":[{"rounded-tr":A()}],"rounded-br":[{"rounded-br":A()}],"rounded-bl":[{"rounded-bl":A()}],"border-w":[{border:R()}],"border-w-x":[{"border-x":R()}],"border-w-y":[{"border-y":R()}],"border-w-s":[{"border-s":R()}],"border-w-e":[{"border-e":R()}],"border-w-bs":[{"border-bs":R()}],"border-w-be":[{"border-be":R()}],"border-w-t":[{"border-t":R()}],"border-w-r":[{"border-r":R()}],"border-w-b":[{"border-b":R()}],"border-w-l":[{"border-l":R()}],"divide-x":[{"divide-x":R()}],"divide-x-reverse":["divide-x-reverse"],"divide-y":[{"divide-y":R()}],"divide-y-reverse":["divide-y-reverse"],"border-style":[{border:[...ie(),"hidden","none"]}],"divide-style":[{divide:[...ie(),"hidden","none"]}],"border-color":[{border:m()}],"border-color-x":[{"border-x":m()}],"border-color-y":[{"border-y":m()}],"border-color-s":[{"border-s":m()}],"border-color-e":[{"border-e":m()}],"border-color-bs":[{"border-bs":m()}],"border-color-be":[{"border-be":m()}],"border-color-t":[{"border-t":m()}],"border-color-r":[{"border-r":m()}],"border-color-b":[{"border-b":m()}],"border-color-l":[{"border-l":m()}],"divide-color":[{divide:m()}],"outline-style":[{outline:[...ie(),"none","hidden"]}],"outline-offset":[{"outline-offset":[g,u,d]}],"outline-w":[{outline:["",g,ee,$]}],"outline-color":[{outline:m()}],shadow:[{shadow:["","inner","none",f,he,ue]}],"shadow-color":[{shadow:m()}],"inset-shadow":[{"inset-shadow":["none",y,he,ue]}],"inset-shadow-color":[{"inset-shadow":m()}],"ring-w":[{ring:R()}],"ring-w-inset":["ring-inset"],"ring-color":[{ring:m()}],"ring-offset-w":[{"ring-offset":[g,$]}],"ring-offset-color":[{"ring-offset":m()}],"inset-ring-w":[{"inset-ring":R()}],"inset-ring-color":[{"inset-ring":m()}],"text-shadow":[{"text-shadow":["none",k,he,ue]}],"text-shadow-color":[{"text-shadow":m()}],opacity:[{opacity:[g,u,d]}],"mix-blend":[{"mix-blend":[...$e(),"plus-darker","plus-lighter"]}],"bg-blend":[{"bg-blend":$e()}],"mask-clip":[{"mask-clip":["border","padding","content","fill","stroke","view"]},"mask-no-clip"],"mask-composite":[{mask:["add","subtract","intersect","exclude"]}],"mask-image-linear-pos":[{"mask-linear":[g]}],"mask-image-linear-from-pos":[{"mask-linear-from":S()}],"mask-image-linear-to-pos":[{"mask-linear-to":S()}],"mask-image-linear-from-color":[{"mask-linear-from":m()}],"mask-image-linear-to-color":[{"mask-linear-to":m()}],"mask-image-t-from-pos":[{"mask-t-from":S()}],"mask-image-t-to-pos":[{"mask-t-to":S()}],"mask-image-t-from-color":[{"mask-t-from":m()}],"mask-image-t-to-color":[{"mask-t-to":m()}],"mask-image-r-from-pos":[{"mask-r-from":S()}],"mask-image-r-to-pos":[{"mask-r-to":S()}],"mask-image-r-from-color":[{"mask-r-from":m()}],"mask-image-r-to-color":[{"mask-r-to":m()}],"mask-image-b-from-pos":[{"mask-b-from":S()}],"mask-image-b-to-pos":[{"mask-b-to":S()}],"mask-image-b-from-color":[{"mask-b-from":m()}],"mask-image-b-to-color":[{"mask-b-to":m()}],"mask-image-l-from-pos":[{"mask-l-from":S()}],"mask-image-l-to-pos":[{"mask-l-to":S()}],"mask-image-l-from-color":[{"mask-l-from":m()}],"mask-image-l-to-color":[{"mask-l-to":m()}],"mask-image-x-from-pos":[{"mask-x-from":S()}],"mask-image-x-to-pos":[{"mask-x-to":S()}],"mask-image-x-from-color":[{"mask-x-from":m()}],"mask-image-x-to-color":[{"mask-x-to":m()}],"mask-image-y-from-pos":[{"mask-y-from":S()}],"mask-image-y-to-pos":[{"mask-y-to":S()}],"mask-image-y-from-color":[{"mask-y-from":m()}],"mask-image-y-to-color":[{"mask-y-to":m()}],"mask-image-radial":[{"mask-radial":[u,d]}],"mask-image-radial-from-pos":[{"mask-radial-from":S()}],"mask-image-radial-to-pos":[{"mask-radial-to":S()}],"mask-image-radial-from-color":[{"mask-radial-from":m()}],"mask-image-radial-to-color":[{"mask-radial-to":m()}],"mask-image-radial-shape":[{"mask-radial":["circle","ellipse"]}],"mask-image-radial-size":[{"mask-radial":[{closest:["side","corner"],farthest:["side","corner"]}]}],"mask-image-radial-pos":[{"mask-radial-at":j()}],"mask-image-conic-pos":[{"mask-conic":[g]}],"mask-image-conic-from-pos":[{"mask-conic-from":S()}],"mask-image-conic-to-pos":[{"mask-conic-to":S()}],"mask-image-conic-from-color":[{"mask-conic-from":m()}],"mask-image-conic-to-color":[{"mask-conic-to":m()}],"mask-mode":[{mask:["alpha","luminance","match"]}],"mask-origin":[{"mask-origin":["border","padding","content","fill","stroke","view"]}],"mask-position":[{mask:De()}],"mask-repeat":[{mask:Fe()}],"mask-size":[{mask:We()}],"mask-type":[{"mask-type":["alpha","luminance"]}],"mask-image":[{mask:["none",u,d]}],filter:[{filter:["","none",u,d]}],blur:[{blur:Ke()}],brightness:[{brightness:[g,u,d]}],contrast:[{contrast:[g,u,d]}],"drop-shadow":[{"drop-shadow":["","none",x,he,ue]}],"drop-shadow-color":[{"drop-shadow":m()}],grayscale:[{grayscale:["",g,u,d]}],"hue-rotate":[{"hue-rotate":[g,u,d]}],invert:[{invert:["",g,u,d]}],saturate:[{saturate:[g,u,d]}],sepia:[{sepia:["",g,u,d]}],"backdrop-filter":[{"backdrop-filter":["","none",u,d]}],"backdrop-blur":[{"backdrop-blur":Ke()}],"backdrop-brightness":[{"backdrop-brightness":[g,u,d]}],"backdrop-contrast":[{"backdrop-contrast":[g,u,d]}],"backdrop-grayscale":[{"backdrop-grayscale":["",g,u,d]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[g,u,d]}],"backdrop-invert":[{"backdrop-invert":["",g,u,d]}],"backdrop-opacity":[{"backdrop-opacity":[g,u,d]}],"backdrop-saturate":[{"backdrop-saturate":[g,u,d]}],"backdrop-sepia":[{"backdrop-sepia":["",g,u,d]}],"border-collapse":[{border:["collapse","separate"]}],"border-spacing":[{"border-spacing":p()}],"border-spacing-x":[{"border-spacing-x":p()}],"border-spacing-y":[{"border-spacing-y":p()}],"table-layout":[{table:["auto","fixed"]}],caption:[{caption:["top","bottom"]}],transition:[{transition:["","all","colors","opacity","shadow","transform","none",u,d]}],"transition-behavior":[{transition:["normal","discrete"]}],duration:[{duration:[g,"initial",u,d]}],ease:[{ease:["linear","initial",V,u,d]}],delay:[{delay:[g,u,d]}],animate:[{animate:["none",z,u,d]}],backface:[{backface:["hidden","visible"]}],perspective:[{perspective:[b,u,d]}],"perspective-origin":[{"perspective-origin":N()}],rotate:[{rotate:le()}],"rotate-x":[{"rotate-x":le()}],"rotate-y":[{"rotate-y":le()}],"rotate-z":[{"rotate-z":le()}],scale:[{scale:ce()}],"scale-x":[{"scale-x":ce()}],"scale-y":[{"scale-y":ce()}],"scale-z":[{"scale-z":ce()}],"scale-3d":["scale-3d"],skew:[{skew:ve()}],"skew-x":[{"skew-x":ve()}],"skew-y":[{"skew-y":ve()}],transform:[{transform:[u,d,"","none","gpu","cpu"]}],"transform-origin":[{origin:N()}],"transform-style":[{transform:["3d","flat"]}],translate:[{translate:de()}],"translate-x":[{"translate-x":de()}],"translate-y":[{"translate-y":de()}],"translate-z":[{"translate-z":de()}],"translate-none":["translate-none"],zoom:[{zoom:[_,u,d]}],accent:[{accent:m()}],appearance:[{appearance:["none","auto"]}],"caret-color":[{caret:m()}],"color-scheme":[{scheme:["normal","dark","light","light-dark","only-dark","only-light"]}],cursor:[{cursor:["auto","default","pointer","wait","text","move","help","not-allowed","none","context-menu","progress","cell","crosshair","vertical-text","alias","copy","no-drop","grab","grabbing","all-scroll","col-resize","row-resize","n-resize","e-resize","s-resize","w-resize","ne-resize","nw-resize","se-resize","sw-resize","ew-resize","ns-resize","nesw-resize","nwse-resize","zoom-in","zoom-out",u,d]}],"field-sizing":[{"field-sizing":["fixed","content"]}],"pointer-events":[{"pointer-events":["auto","none"]}],resize:[{resize:["none","","y","x"]}],"scroll-behavior":[{scroll:["auto","smooth"]}],"scrollbar-thumb-color":[{"scrollbar-thumb":m()}],"scrollbar-track-color":[{"scrollbar-track":m()}],"scrollbar-gutter":[{"scrollbar-gutter":["auto","stable","both"]}],"scrollbar-w":[{scrollbar:["auto","thin","none"]}],"scroll-m":[{"scroll-m":p()}],"scroll-mx":[{"scroll-mx":p()}],"scroll-my":[{"scroll-my":p()}],"scroll-ms":[{"scroll-ms":p()}],"scroll-me":[{"scroll-me":p()}],"scroll-mbs":[{"scroll-mbs":p()}],"scroll-mbe":[{"scroll-mbe":p()}],"scroll-mt":[{"scroll-mt":p()}],"scroll-mr":[{"scroll-mr":p()}],"scroll-mb":[{"scroll-mb":p()}],"scroll-ml":[{"scroll-ml":p()}],"scroll-p":[{"scroll-p":p()}],"scroll-px":[{"scroll-px":p()}],"scroll-py":[{"scroll-py":p()}],"scroll-ps":[{"scroll-ps":p()}],"scroll-pe":[{"scroll-pe":p()}],"scroll-pbs":[{"scroll-pbs":p()}],"scroll-pbe":[{"scroll-pbe":p()}],"scroll-pt":[{"scroll-pt":p()}],"scroll-pr":[{"scroll-pr":p()}],"scroll-pb":[{"scroll-pb":p()}],"scroll-pl":[{"scroll-pl":p()}],"snap-align":[{snap:["start","end","center","align-none"]}],"snap-stop":[{snap:["normal","always"]}],"snap-type":[{snap:["none","x","y","both"]}],"snap-strictness":[{snap:["mandatory","proximity"]}],touch:[{touch:["auto","none","manipulation"]}],"touch-x":[{"touch-pan":["x","left","right"]}],"touch-y":[{"touch-pan":["y","up","down"]}],"touch-pz":["touch-pinch-zoom"],select:[{select:["none","text","all","auto"]}],"will-change":[{"will-change":["auto","scroll","contents","transform",u,d]}],fill:[{fill:["none",...m()]}],"stroke-w":[{stroke:[g,ee,$,rt]}],stroke:[{stroke:["none",...m()]}],"forced-color-adjust":[{"forced-color-adjust":["auto","none"]}]},conflictingClassGroups:{"container-named":["container-type"],overflow:["overflow-x","overflow-y"],overscroll:["overscroll-x","overscroll-y"],inset:["inset-x","inset-y","inset-bs","inset-be","start","end","top","right","bottom","left"],"inset-x":["start","end","right","left"],"inset-y":["inset-bs","inset-be","top","bottom"],flex:["basis","grow","shrink"],gap:["gap-x","gap-y"],p:["px","py","ps","pe","pbs","pbe","pt","pr","pb","pl"],px:["ps","pe","pr","pl"],py:["pbs","pbe","pt","pb"],m:["mx","my","ms","me","mbs","mbe","mt","mr","mb","ml"],mx:["ms","me","mr","ml"],my:["mbs","mbe","mt","mb"],size:["w","h"],"font-size":["leading"],"fvn-normal":["fvn-ordinal","fvn-slashed-zero","fvn-figure","fvn-spacing","fvn-fraction"],"fvn-ordinal":["fvn-normal"],"fvn-slashed-zero":["fvn-normal"],"fvn-figure":["fvn-normal"],"fvn-spacing":["fvn-normal"],"fvn-fraction":["fvn-normal"],"line-clamp":["display","overflow"],rounded:["rounded-s","rounded-e","rounded-t","rounded-r","rounded-b","rounded-l","rounded-ss","rounded-se","rounded-ee","rounded-es","rounded-tl","rounded-tr","rounded-br","rounded-bl"],"rounded-s":["rounded-ss","rounded-es"],"rounded-e":["rounded-se","rounded-ee"],"rounded-t":["rounded-tl","rounded-tr"],"rounded-r":["rounded-tr","rounded-br"],"rounded-b":["rounded-br","rounded-bl"],"rounded-l":["rounded-tl","rounded-bl"],"border-spacing":["border-spacing-x","border-spacing-y"],"border-w":["border-w-x","border-w-y","border-w-s","border-w-e","border-w-bs","border-w-be","border-w-t","border-w-r","border-w-b","border-w-l"],"border-w-x":["border-w-s","border-w-e","border-w-r","border-w-l"],"border-w-y":["border-w-bs","border-w-be","border-w-t","border-w-b"],"border-color":["border-color-x","border-color-y","border-color-s","border-color-e","border-color-bs","border-color-be","border-color-t","border-color-r","border-color-b","border-color-l"],"border-color-x":["border-color-s","border-color-e","border-color-r","border-color-l"],"border-color-y":["border-color-bs","border-color-be","border-color-t","border-color-b"],translate:["translate-x","translate-y","translate-none"],"translate-none":["translate","translate-x","translate-y","translate-z"],"scroll-m":["scroll-mx","scroll-my","scroll-ms","scroll-me","scroll-mbs","scroll-mbe","scroll-mt","scroll-mr","scroll-mb","scroll-ml"],"scroll-mx":["scroll-ms","scroll-me","scroll-mr","scroll-ml"],"scroll-my":["scroll-mbs","scroll-mbe","scroll-mt","scroll-mb"],"scroll-p":["scroll-px","scroll-py","scroll-ps","scroll-pe","scroll-pbs","scroll-pbe","scroll-pt","scroll-pr","scroll-pb","scroll-pl"],"scroll-px":["scroll-ps","scroll-pe","scroll-pr","scroll-pl"],"scroll-py":["scroll-pbs","scroll-pbe","scroll-pt","scroll-pb"],touch:["touch-x","touch-y","touch-pz"],"touch-x":["touch"],"touch-y":["touch"],"touch-pz":["touch"]},conflictingClassGroupModifiers:{"font-size":["leading"]},postfixLookupClassGroups:["container-type"],orderSensitiveModifiers:["*","**","after","backdrop","before","details-content","file","first-letter","first-line","marker","placeholder","selection"]}},Yn=Jr(wn);function Mn(e,t){if(e instanceof RegExp)return{keys:!1,pattern:e};var r,n,a,o,s=[],l="",h=e.split("/");for(h[0]||h.shift();a=h.shift();)r=a[0],r==="*"?(s.push(r),l+=a[1]==="?"?"(?:/(.*))?":"/(.*)"):r===":"?(n=a.indexOf("?",1),o=a.indexOf(".",1),s.push(a.substring(1,~n?n:~o?o:a.length)),l+=~n&&!~o?"(?:/([^/]+?))?":"/([^/]+?)",~o&&(l+=(~n?"?":"")+"\\"+a.substring(o))):l+="/"+a;return{keys:s,pattern:new RegExp("^"+l+(t?"(?=$|/)":"/?$"),"i")}}var Me={exports:{}},Ce={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ot;function Cn(){if(ot)return Ce;ot=1;var e=Qt();function t(y,k){return y===k&&(y!==0||1/y===1/k)||y!==y&&k!==k}var r=typeof Object.is=="function"?Object.is:t,n=e.useState,a=e.useEffect,o=e.useLayoutEffect,s=e.useDebugValue;function l(y,k){var x=k(),M=n({inst:{value:x,getSnapshot:k}}),b=M[0].inst,v=M[1];return o(function(){b.value=x,b.getSnapshot=k,h(b)&&v({inst:b})},[y,x,k]),a(function(){return h(b)&&v({inst:b}),y(function(){h(b)&&v({inst:b})})},[y]),s(x),x}function h(y){var k=y.getSnapshot;y=y.value;try{var x=k();return!r(y,x)}catch{return!0}}function c(y,k){return k()}var f=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?c:l;return Ce.useSyncExternalStore=e.useSyncExternalStore!==void 0?e.useSyncExternalStore:f,Ce}var st;function zn(){return st||(st=1,Me.exports=Cn()),Me.exports}var Sn=zn();const An=Xt.useInsertionEffect,Rn=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u",Ut=Rn?w.useLayoutEffect:w.useEffect,En=An||Ut,Te=e=>{const t=w.useRef([e,(...r)=>t[0](...r)]).current;return En(()=>{t[0]=e}),t[1]},Pn="popstate",je="pushState",Ne="replaceState",Ln="hashchange",it=[Pn,je,Ne,Ln],On=e=>{for(const t of it)addEventListener(t,e);return()=>{for(const t of it)removeEventListener(t,e)}},Gt=(e,t)=>Sn.useSyncExternalStore(On,e,t),_n=()=>location.search,Vn=({ssrSearch:e=""}={})=>Gt(_n,()=>e),lt=()=>location.pathname,In=({ssrPath:e}={})=>Gt(lt,e?()=>e:lt),qn=(e,{replace:t=!1,state:r=null}={})=>history[t?Ne:je](r,"",e),Tn=(e={})=>[In(e),qn],ct=Symbol.for("wouter_v3");if(typeof history<"u"&&typeof window[ct]>"u"){for(const e of[je,Ne]){const t=history[e];history[e]=function(){const r=t.apply(this,arguments),n=new Event(e);return n.arguments=arguments,dispatchEvent(n),r}}Object.defineProperty(window,ct,{value:!0})}const jn=(e,t)=>t.toLowerCase().indexOf(e.toLowerCase())?"~"+t:t.slice(e.length)||"/",Dt=(e="")=>e==="/"?"":e,Nn=(e,t)=>e[0]==="~"?e.slice(1):Dt(t)+e,Bn=(e="",t)=>jn(_e(Dt(e)),_e(t)),Hn=e=>e[0]==="?"?e.slice(1):e,_e=e=>{try{return decodeURI(e)}catch{return e}},Un=e=>_e(Hn(e)),Ft={hook:Tn,searchHook:Vn,parser:Mn,base:"",ssrPath:void 0,ssrSearch:void 0,ssrContext:void 0,hrefs:e=>e},Wt=w.createContext(Ft),F=()=>w.useContext(Wt),$t={},Kt=w.createContext($t),Gn=()=>w.useContext(Kt),oe=e=>{const[t,r]=e.hook(e);return[Bn(e.base,t),Te((n,a)=>r(Nn(n,e.base),a))]},Dn=()=>oe(F()),Jn=()=>{const e=F();return Un(e.searchHook(e))},Be=(e,t,r,n)=>{const{pattern:a,keys:o}=t instanceof RegExp?{keys:!1,pattern:t}:e(t||"*",n),s=a.exec(r)||[],[l,...h]=s;return l!==void 0?[!0,(()=>{const c=o!==!1?Object.fromEntries(o.map((y,k)=>[y,h[k]])):s.groups;let f={...h};return c&&Object.assign(f,c),f})(),...n?[l]:[]]:[!1,null]},ea=e=>Be(F().parser,e,Dn()[0]),Fn=({children:e,...t})=>{const r=F(),n=t.hook?Ft:r;let a=n;const[o,s]=t.ssrPath?.split("?")??[];s&&(t.ssrSearch=s,t.ssrPath=o),t.hrefs=t.hrefs??t.hook?.hrefs;let l=w.useRef({}),h=l.current,c=h;for(let f in n){const y=f==="base"?n[f]+(t[f]||""):t[f]||n[f];h===c&&y!==c[f]&&(l.current=c={...c}),c[f]=y,(y!==n[f]||y!==a[f])&&(a=c)}return w.createElement(Wt.Provider,{value:a,children:e})},dt=({children:e,component:t},r)=>t?w.createElement(t,{params:r}):typeof e=="function"?e(r):e,Wn=e=>{let t=w.useRef($t);const r=t.current;return t.current=Object.keys(e).length!==Object.keys(r).length||Object.entries(e).some(([n,a])=>a!==r[n])?e:r},ta=({path:e,nest:t,match:r,...n})=>{const a=F(),[o]=oe(a),[s,l,h]=r??Be(a.parser,e,o,t),c=Wn({...Gn(),...l});if(!s)return null;const f=h?w.createElement(Fn,{base:h},dt(n,c)):dt(n,c);return w.createElement(Kt.Provider,{value:c,children:f})},ra=w.forwardRef((e,t)=>{const r=F(),[n,a]=oe(r),{to:o="",href:s=o,onClick:l,asChild:h,children:c,className:f,replace:y,state:k,...x}=e,M=Te(v=>{v.ctrlKey||v.metaKey||v.altKey||v.shiftKey||v.button!==0||(l?.(v),v.defaultPrevented||(v.preventDefault(),a(s,e)))}),b=r.hrefs(s[0]==="~"?s.slice(1):r.base+s,r);return h&&w.isValidElement(c)?w.cloneElement(c,{onClick:M,href:b}):w.createElement("a",{...x,onClick:M,href:b,className:f?.call?f(n===s):f,children:c,ref:t})}),Ve=e=>Array.isArray(e)?e.flatMap(t=>Ve(t&&t.type===w.Fragment?t.props.children:t)):[e],na=({children:e,location:t})=>{const r=F(),[n]=oe(r);typeof window<"u"&&(window.__WOUTER_ROUTES__||(window.__WOUTER_ROUTES__=[]),Ve(e).forEach(o=>{if(w.isValidElement(o)&&o.props.path){const s=o.props.path;window.__WOUTER_ROUTES__.includes(s)||window.__WOUTER_ROUTES__.push(s)}}));for(const a of Ve(e)){let o=0;if(w.isValidElement(a)&&(o=Be(r.parser,a.props.path,t||n,a.props.nest))[0])return w.cloneElement(a,{match:o})}return null},aa=e=>{const{to:t,href:r=t}=e,n=F(),[,a]=oe(n),o=Te(()=>a(t||r,e)),{ssrContext:s}=n;return Ut(()=>{o()},[]),s&&(s.redirectTo=t),null};/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $n=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),Zt=(...e)=>e.filter((t,r,n)=>!!t&&n.indexOf(t)===r).join(" ");/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Kn={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zn=w.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:n,className:a="",children:o,iconNode:s,...l},h)=>w.createElement("svg",{ref:h,...Kn,width:t,height:t,stroke:e,strokeWidth:n?Number(r)*24/Number(t):r,className:Zt("lucide",a),...l},[...s.map(([c,f])=>w.createElement(c,f)),...Array.isArray(o)?o:[o]]));/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=(e,t)=>{const r=w.forwardRef(({className:n,...a},o)=>w.createElement(Zn,{ref:o,iconNode:t,className:Zt(`lucide-${$n(e)}`,n),...a}));return r.displayName=`${e}`,r};/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=i("Activity",[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=i("ArrowLeftRight",[["path",{d:"M8 3 4 7l4 4",key:"9rb6wj"}],["path",{d:"M4 7h16",key:"6tx8e3"}],["path",{d:"m16 21 4-4-4-4",key:"siv7j2"}],["path",{d:"M20 17H4",key:"h6l3hr"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=i("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=i("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=i("ArrowUpDown",[["path",{d:"m21 16-4 4-4-4",key:"f6ql7i"}],["path",{d:"M17 20V4",key:"1ejh1v"}],["path",{d:"m3 8 4-4 4 4",key:"11wl7u"}],["path",{d:"M7 4v16",key:"1glfcx"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=i("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=i("Award",[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=i("BadgeCheck",[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",key:"3c2336"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=i("Beaker",[["path",{d:"M4.5 3h15",key:"c7n0jr"}],["path",{d:"M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3",key:"m1uhx7"}],["path",{d:"M6 14h12",key:"4cwo0f"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=i("BellRing",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}],["path",{d:"M4 2C2.8 3.7 2 5.7 2 8",key:"tap9e0"}],["path",{d:"M22 8c0-2.3-.8-4.3-2-6",key:"5bb3ad"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=i("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=i("BookOpenCheck",[["path",{d:"M12 21V7",key:"gj6g52"}],["path",{d:"m16 12 2 2 4-4",key:"mdajum"}],["path",{d:"M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3",key:"8arnkb"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=i("BookOpen",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=i("Bookmark",[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ba=i("Box",[["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=i("BrainCircuit",[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M9 13a4.5 4.5 0 0 0 3-4",key:"10igwf"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M12 13h4",key:"1ku699"}],["path",{d:"M12 18h6a2 2 0 0 1 2 2v1",key:"105ag5"}],["path",{d:"M12 8h8",key:"1lhi5i"}],["path",{d:"M16 8V5a2 2 0 0 1 2-2",key:"u6izg6"}],["circle",{cx:"16",cy:"13",r:".5",key:"ry7gng"}],["circle",{cx:"18",cy:"3",r:".5",key:"1aiba7"}],["circle",{cx:"20",cy:"21",r:".5",key:"yhc1fs"}],["circle",{cx:"20",cy:"8",r:".5",key:"1e43v0"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=i("Brain",[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=i("Briefcase",[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ma=i("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=i("Calculator",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const za=i("CalendarClock",[["path",{d:"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",key:"1osxxc"}],["path",{d:"M16 2v4",key:"4m81vk"}],["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M3 10h5",key:"r794hk"}],["path",{d:"M17.5 17.5 16 16.3V14",key:"akvzfd"}],["circle",{cx:"16",cy:"16",r:"6",key:"qoo3c4"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sa=i("CalendarDays",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Aa=i("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ra=i("ChartColumn",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ea=i("ChartNoAxesCombined",[["path",{d:"M12 16v5",key:"zza2cw"}],["path",{d:"M16 14v7",key:"1g90b9"}],["path",{d:"M20 10v11",key:"1iqoj0"}],["path",{d:"m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15",key:"1fw8x9"}],["path",{d:"M4 18v3",key:"1yp0dc"}],["path",{d:"M8 14v7",key:"n3cwzv"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pa=i("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const La=i("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oa=i("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _a=i("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Va=i("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ia=i("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qa=i("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ta=i("CircleHelp",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ja=i("CirclePlay",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polygon",{points:"10 8 16 12 10 16 10 8",key:"1cimsy"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Na=i("CircleUserRound",[["path",{d:"M18 20a6 6 0 0 0-12 0",key:"1qehca"}],["circle",{cx:"12",cy:"10",r:"4",key:"1h16sb"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ba=i("CircleX",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ha=i("ClipboardCheck",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ua=i("ClipboardList",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ga=i("Clock3",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16.5 12",key:"1aq6pp"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Da=i("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fa=i("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wa=i("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $a=i("Database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ka=i("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Za=i("DoorOpen",[["path",{d:"M13 4h3a2 2 0 0 1 2 2v14",key:"hrm0s9"}],["path",{d:"M2 20h3",key:"1gaodv"}],["path",{d:"M13 20h9",key:"s90cdi"}],["path",{d:"M10 12v.01",key:"vx6srw"}],["path",{d:"M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z",key:"199qr4"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xa=i("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qa=i("Droplets",[["path",{d:"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",key:"1ptgy4"}],["path",{d:"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",key:"1sl1rz"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ya=i("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ja=i("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const eo=i("FileCheck2",[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m3 15 2 2 4-4",key:"1lhrkk"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const to=i("FileDown",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ro=i("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const no=i("Flag",[["path",{d:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",key:"i9b6wo"}],["line",{x1:"4",x2:"4",y1:"22",y2:"15",key:"1cm3nv"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ao=i("Flame",[["path",{d:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",key:"96xj49"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oo=i("FlaskConical",[["path",{d:"M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2",key:"pzvekw"}],["path",{d:"M8.5 2h7",key:"csnxdl"}],["path",{d:"M7 16h10",key:"wp8him"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const so=i("Gamepad2",[["line",{x1:"6",x2:"10",y1:"11",y2:"11",key:"1gktln"}],["line",{x1:"8",x2:"8",y1:"9",y2:"13",key:"qnk9ow"}],["line",{x1:"15",x2:"15.01",y1:"12",y2:"12",key:"krot7o"}],["line",{x1:"18",x2:"18.01",y1:"10",y2:"10",key:"1lcuu1"}],["path",{d:"M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z",key:"mfqc10"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const io=i("Gauge",[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lo=i("GitBranch",[["line",{x1:"6",x2:"6",y1:"3",y2:"15",key:"17qcm7"}],["circle",{cx:"18",cy:"6",r:"3",key:"1h7g24"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["path",{d:"M18 9a9 9 0 0 1-9 9",key:"n2h4wq"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const co=i("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uo=i("GraduationCap",[["path",{d:"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",key:"j76jl0"}],["path",{d:"M22 10v6",key:"1lu8f3"}],["path",{d:"M6 12.5V16a6 3 0 0 0 12 0v-3.5",key:"1r8lef"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ho=i("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const po=i("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yo=i("Layers3",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m6.08 9.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59",key:"1e5n1m"}],["path",{d:"m6.08 14.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59",key:"1iwflc"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fo=i("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mo=i("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ko=i("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const go=i("Lightbulb",[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bo=i("ListChecks",[["path",{d:"m3 17 2 2 4-4",key:"1jhpwq"}],["path",{d:"m3 7 2 2 4-4",key:"1obspn"}],["path",{d:"M13 6h8",key:"15sg57"}],["path",{d:"M13 12h8",key:"h98zly"}],["path",{d:"M13 18h8",key:"oe0vm4"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vo=i("ListOrdered",[["path",{d:"M10 12h11",key:"6m4ad9"}],["path",{d:"M10 18h11",key:"11hvi2"}],["path",{d:"M10 6h11",key:"c7qv1k"}],["path",{d:"M4 10h2",key:"16xx2s"}],["path",{d:"M4 6h1v4",key:"cnovpq"}],["path",{d:"M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",key:"m9a95d"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xo=i("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wo=i("LockKeyhole",[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mo=i("LogIn",[["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}],["polyline",{points:"10 17 15 12 10 7",key:"1ail0h"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Co=i("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zo=i("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const So=i("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ao=i("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ro=i("MessageCircleQuestion",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Eo=i("MessageSquareText",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}],["path",{d:"M13 8H7",key:"14i4kc"}],["path",{d:"M17 12H7",key:"16if0g"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Po=i("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lo=i("Monitor",[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oo=i("Network",[["rect",{x:"16",y:"16",width:"6",height:"6",rx:"1",key:"4q2zg0"}],["rect",{x:"2",y:"16",width:"6",height:"6",rx:"1",key:"8cvhb9"}],["rect",{x:"9",y:"2",width:"6",height:"6",rx:"1",key:"1egb70"}],["path",{d:"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3",key:"1jsf9p"}],["path",{d:"M12 12V8",key:"2874zd"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _o=i("NotebookTabs",[["path",{d:"M2 6h4",key:"aawbzj"}],["path",{d:"M2 10h4",key:"l0bgd4"}],["path",{d:"M2 14h4",key:"1gsvsf"}],["path",{d:"M2 18h4",key:"1bu2t1"}],["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["path",{d:"M15 2v20",key:"dcj49h"}],["path",{d:"M15 7h5",key:"1xj5lc"}],["path",{d:"M15 12h5",key:"w5shd9"}],["path",{d:"M15 17h5",key:"1qaofu"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vo=i("Pause",[["rect",{x:"14",y:"4",width:"4",height:"16",rx:"1",key:"zuxfzm"}],["rect",{x:"6",y:"4",width:"4",height:"16",rx:"1",key:"1okwgv"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Io=i("Pencil",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qo=i("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const To=i("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jo=i("Printer",[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const No=i("Radio",[["path",{d:"M4.9 19.1C1 15.2 1 8.8 4.9 4.9",key:"1vaf9d"}],["path",{d:"M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5",key:"u1ii0m"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5",key:"1j5fej"}],["path",{d:"M19.1 4.9C23 8.8 23 15.1 19.1 19",key:"10b0cb"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bo=i("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ho=i("Repeat2",[["path",{d:"m2 9 3-3 3 3",key:"1ltn5i"}],["path",{d:"M13 18H7a2 2 0 0 1-2-2V6",key:"1r6tfw"}],["path",{d:"m22 15-3 3-3-3",key:"4rnwn2"}],["path",{d:"M11 6h6a2 2 0 0 1 2 2v10",key:"2f72bc"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uo=i("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Go=i("RotateCw",[["path",{d:"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8",key:"1p45f6"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Do=i("SearchCheck",[["path",{d:"m8 11 2 2 4-4",key:"1sed1v"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fo=i("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wo=i("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $o=i("ShieldAlert",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ko=i("ShieldCheck",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zo=i("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xo=i("Sigma",[["path",{d:"M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2",key:"wuwx1p"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qo=i("SlidersHorizontal",[["line",{x1:"21",x2:"14",y1:"4",y2:"4",key:"obuewd"}],["line",{x1:"10",x2:"3",y1:"4",y2:"4",key:"1q6298"}],["line",{x1:"21",x2:"12",y1:"12",y2:"12",key:"1iu8h1"}],["line",{x1:"8",x2:"3",y1:"12",y2:"12",key:"ntss68"}],["line",{x1:"21",x2:"16",y1:"20",y2:"20",key:"14d8ph"}],["line",{x1:"12",x2:"3",y1:"20",y2:"20",key:"m0wm8r"}],["line",{x1:"14",x2:"14",y1:"2",y2:"6",key:"14e1ph"}],["line",{x1:"8",x2:"8",y1:"10",y2:"14",key:"1i6ji0"}],["line",{x1:"16",x2:"16",y1:"18",y2:"22",key:"1lctlv"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yo=i("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jo=i("Star",[["polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",key:"8f66p6"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const es=i("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ts=i("TimerReset",[["path",{d:"M10 2h4",key:"n1abiw"}],["path",{d:"M12 14v-4",key:"1evpnu"}],["path",{d:"M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6",key:"1ts96g"}],["path",{d:"M9 17H4v5",key:"8t5av"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rs=i("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ns=i("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const as=i("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const os=i("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ss=i("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const is=i("UserCheck",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["polyline",{points:"16 11 18 13 22 9",key:"1pwet4"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ls=i("UserMinus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cs=i("UserPlus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ds=i("UsersRound",[["path",{d:"M18 21a8 8 0 0 0-16 0",key:"3ypg7q"}],["circle",{cx:"10",cy:"8",r:"5",key:"o932ke"}],["path",{d:"M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3",key:"10s06x"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=i("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hs=i("Waves",[["path",{d:"M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",key:"knzxuh"}],["path",{d:"M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",key:"2jd2cc"}],["path",{d:"M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",key:"rd2r6e"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=i("Wrench",[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",key:"cbrjhi"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ys=i("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fs=i("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]),ut=e=>typeof e=="boolean"?`${e}`:e===0?"0":e,ht=Lr,ms=(e,t)=>r=>{var n;if(t?.variants==null)return ht(e,r?.class,r?.className);const{variants:a,defaultVariants:o}=t,s=Object.keys(a).map(c=>{const f=r?.[c],y=o?.[c];if(f===null)return null;const k=ut(f)||ut(y);return a[c][k]}),l=r&&Object.entries(r).reduce((c,f)=>{let[y,k]=f;return k===void 0||(c[y]=k),c},{}),h=t==null||(n=t.compoundVariants)===null||n===void 0?void 0:n.reduce((c,f)=>{let{class:y,className:k,...x}=f;return Object.entries(x).every(M=>{let[b,v]=M;return Array.isArray(v)?v.includes({...o,...l}[b]):{...o,...l}[b]===v})?[...c,y,k]:c},[]);return ht(e,s,h,r?.class,r?.className)};export{ja as $,la as A,ga as B,Ga as C,Xa as D,Ja as E,eo as F,uo as G,ho as H,po as I,So as J,Ka as K,ra as L,Lo as M,Da as N,Aa as O,Vo as P,co as Q,Uo as R,Yo as S,as as T,Ya as U,ea as V,ps as W,ys as X,aa as Y,Jn as Z,hs as _,ka as a,vo as a$,Jo as a0,go as a1,G as a2,Ba as a3,La as a4,Va as a5,Fa as a6,es as a7,Sa as a8,xo as a9,no as aA,mo as aB,Ua as aC,Wa as aD,Ho as aE,ds as aF,Ea as aG,Po as aH,$a as aI,Go as aJ,To as aK,ss as aL,rs as aM,Fo as aN,Io as aO,ns as aP,is as aQ,Wo as aR,Co as aS,cs as aT,ls as aU,ya as aV,$o as aW,ca as aX,fa as aY,Zo as aZ,Za as a_,Ha as aa,ia as ab,ts as ac,No as ad,Ta as ae,Ra as af,Qa as ag,io as ah,zo as ai,fs as aj,oa as ak,os as al,pa as am,Qo as an,Oo as ao,us as ap,za as aq,ro as ar,oo as as,so as at,ao as au,bo as av,to as aw,ua as ax,wo as ay,Ao as az,xa as b,Do as b0,lo as b1,fo as b2,sa as b3,Na as b4,Xo as b5,_o as b6,Ro as b7,da as b8,Eo as b9,na as ba,ta as bb,Lr as c,ha as d,Ma as e,ba as f,yo as g,qo as h,Ca as i,Ia as j,ko as k,Pa as l,va as m,ma as n,ms as o,Mo as p,jo as q,Gn as r,Ko as s,Yn as t,Dn as u,qa as v,wa as w,Oa as x,_a as y,Bo as z};
