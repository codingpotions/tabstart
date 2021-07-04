var app=function(){"use strict";function t(){}function n(t){return t()}function e(){return Object.create(null)}function r(t){t.forEach(n)}function o(t){return"function"==typeof t}function c(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}let l,i=!1;function s(t,n,e,r){for(;t<n;){const o=t+(n-t>>1);e(o)<=r?t=o+1:n=o}return t}function u(t,n){i?(!function(t){if(t.hydrate_init)return;t.hydrate_init=!0;const n=t.childNodes,e=new Int32Array(n.length+1),r=new Int32Array(n.length);e[0]=-1;let o=0;for(let t=0;t<n.length;t++){const c=s(1,o+1,(t=>n[e[t]].claim_order),n[t].claim_order)-1;r[t]=e[c]+1;const l=c+1;e[l]=t,o=Math.max(l,o)}const c=[],l=[];let i=n.length-1;for(let t=e[o]+1;0!=t;t=r[t-1]){for(c.push(n[t-1]);i>=t;i--)l.push(n[i]);i--}for(;i>=0;i--)l.push(n[i]);c.reverse(),l.sort(((t,n)=>t.claim_order-n.claim_order));for(let n=0,e=0;n<l.length;n++){for(;e<c.length&&l[n].claim_order>=c[e].claim_order;)e++;const r=e<c.length?c[e]:null;t.insertBefore(l[n],r)}}(t),(void 0===t.actual_end_child||null!==t.actual_end_child&&t.actual_end_child.parentElement!==t)&&(t.actual_end_child=t.firstChild),n!==t.actual_end_child?t.insertBefore(n,t.actual_end_child):t.actual_end_child=n.nextSibling):n.parentNode!==t&&t.appendChild(n)}function a(t,n,e){i&&!e?u(t,n):(n.parentNode!==t||e&&n.nextSibling!==e)&&t.insertBefore(n,e||null)}function f(t){t.parentNode.removeChild(t)}function d(t){return document.createElement(t)}function h(t){return document.createTextNode(t)}function p(){return h(" ")}function g(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function m(t,n){n=""+n,t.wholeText!==n&&(t.data=n)}function $(t,n,e,r){t.style.setProperty(n,e,r?"important":"")}function _(t){l=t}function y(t){(function(){if(!l)throw new Error("Function called outside component initialization");return l})().$$.on_mount.push(t)}const b=[],w=[],v=[],x=[],k=Promise.resolve();let j=!1;function E(t){v.push(t)}let N=!1;const S=new Set;function A(){if(!N){N=!0;do{for(let t=0;t<b.length;t+=1){const n=b[t];_(n),z(n.$$)}for(_(null),b.length=0;w.length;)w.pop()();for(let t=0;t<v.length;t+=1){const n=v[t];S.has(n)||(S.add(n),n())}v.length=0}while(b.length);for(;x.length;)x.pop()();j=!1,N=!1,S.clear()}}function z(t){if(null!==t.fragment){t.update(),r(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(E)}}const B=new Set;function C(t,n){t&&t.i&&(B.delete(t),t.i(n))}function I(t,n,e,r){if(t&&t.o){if(B.has(t))return;B.add(t),undefined.c.push((()=>{B.delete(t),r&&(e&&t.d(1),r())})),t.o(n)}}function M(t){t&&t.c()}function O(t,e,c,l){const{fragment:i,on_mount:s,on_destroy:u,after_update:a}=t.$$;i&&i.m(e,c),l||E((()=>{const e=s.map(n).filter(o);u?u.push(...e):r(e),t.$$.on_mount=[]})),a.forEach(E)}function P(t,n){const e=t.$$;null!==e.fragment&&(r(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function T(t,n){-1===t.$$.dirty[0]&&(b.push(t),j||(j=!0,k.then(A)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function q(n,o,c,s,u,a,d=[-1]){const h=l;_(n);const p=n.$$={fragment:null,ctx:null,props:a,update:t,not_equal:u,bound:e(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(h?h.$$.context:o.context||[]),callbacks:e(),dirty:d,skip_bound:!1};let g=!1;if(p.ctx=c?c(n,o.props||{},((t,e,...r)=>{const o=r.length?r[0]:e;return p.ctx&&u(p.ctx[t],p.ctx[t]=o)&&(!p.skip_bound&&p.bound[t]&&p.bound[t](o),g&&T(n,t)),e})):[],p.update(),g=!0,r(p.before_update),p.fragment=!!s&&s(p.ctx),o.target){if(o.hydrate){i=!0;const t=function(t){return Array.from(t.childNodes)}(o.target);p.fragment&&p.fragment.l(t),t.forEach(f)}else p.fragment&&p.fragment.c();o.intro&&C(n.$$.fragment),O(n,o.target,o.anchor,o.customElement),i=!1,A()}_(h)}class D{$destroy(){P(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(t){var n;this.$$set&&(n=t,0!==Object.keys(n).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function F(n){let e,r,o,c,l,i;return{c(){e=d("h2"),r=h(n[0]),o=h(":"),c=h(n[1]),l=h(":"),i=h(n[2]),g(e,"class","clock svelte-1e6p411")},m(t,n){a(t,e,n),u(e,r),u(e,o),u(e,c),u(e,l),u(e,i)},p(t,[n]){1&n&&m(r,t[0]),2&n&&m(c,t[1]),4&n&&m(i,t[2])},i:t,o:t,d(t){t&&f(e)}}}function H(t){return t<10?"0"+t:t.toString()}function G(t,n,e){let r="00",o="00",c="00";function l(){const t=new Date;e(0,r=H(t.getHours())),e(1,o=H(t.getMinutes())),e(2,c=H(t.getSeconds()))}return y((async()=>{l(),setInterval((()=>l()),1e3)})),[r,o,c]}class J extends D{constructor(t){super(),q(this,t,G,F,c,{})}}function K(t,n,e){const r=t.slice();return r[1]=n[e],r}function L(t){let n,e=t[0],r=[];for(let n=0;n<e.length;n+=1)r[n]=Q(K(t,e,n));return{c(){n=d("div");for(let t=0;t<r.length;t+=1)r[t].c();g(n,"class","sites svelte-1nzwr3j")},m(t,e){a(t,n,e);for(let t=0;t<r.length;t+=1)r[t].m(n,null)},p(t,o){if(1&o){let c;for(e=t[0],c=0;c<e.length;c+=1){const l=K(t,e,c);r[c]?r[c].p(l,o):(r[c]=Q(l),r[c].c(),r[c].m(n,null))}for(;c<r.length;c+=1)r[c].d(1);r.length=e.length}},d(t){t&&f(n),function(t,n){for(let e=0;e<t.length;e+=1)t[e]&&t[e].d(n)}(r,t)}}}function Q(t){let n,e,r,o,c,l;return{c(){n=d("a"),e=d("img"),c=p(),e.src!==(r="https://logo.clearbit.com/"+t[1].domain+"?s=128")&&g(e,"src",r),g(e,"alt",o=t[1].title),g(e,"class","svelte-1nzwr3j"),g(n,"href",l=t[1].url),g(n,"class","svelte-1nzwr3j")},m(t,r){a(t,n,r),u(n,e),u(n,c)},p(t,c){1&c&&e.src!==(r="https://logo.clearbit.com/"+t[1].domain+"?s=128")&&g(e,"src",r),1&c&&o!==(o=t[1].title)&&g(e,"alt",o),1&c&&l!==(l=t[1].url)&&g(n,"href",l)},d(t){t&&f(n)}}}function R(n){let e,r=n[0].length&&L(n);return{c(){r&&r.c(),e=h("")},m(t,n){r&&r.m(t,n),a(t,e,n)},p(t,[n]){t[0].length?r?r.p(t,n):(r=L(t),r.c(),r.m(e.parentNode,e)):r&&(r.d(1),r=null)},i:t,o:t,d(t){r&&r.d(t),t&&f(e)}}}function U(t,n,e){let r=[];return y((async()=>{browser.topSites.get().then((t=>{e(0,r=t.map((t=>{const n=/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g.exec(t.url)[1];return{...t,domain:n}}))),e(0,r=r.filter((t=>!t.domain.includes("localhost"))))}))})),[r]}class V extends D{constructor(t){super(),q(this,t,U,R,c,{})}}function W(t){let n,e,r,o,c,l,i,s,h;return c=new J({}),s=new V({}),{c(){n=d("main"),e=d("div"),r=d("div"),o=d("div"),M(c.$$.fragment),l=p(),i=d("div"),M(s.$$.fragment),g(o,"class","clock-container svelte-105hrt6"),g(i,"class","sites-container svelte-105hrt6"),g(r,"class","content svelte-105hrt6"),g(e,"class","bg svelte-105hrt6"),$(e,"background-image","url('"+t[0]+"')"),g(n,"class","svelte-105hrt6")},m(t,f){a(t,n,f),u(n,e),u(e,r),u(r,o),O(c,o,null),u(r,l),u(r,i),O(s,i,null),h=!0},p(t,[n]){(!h||1&n)&&$(e,"background-image","url('"+t[0]+"')")},i(t){h||(C(c.$$.fragment,t),C(s.$$.fragment,t),h=!0)},o(t){I(c.$$.fragment,t),I(s.$$.fragment,t),h=!1},d(t){t&&f(n),P(c),P(s)}}}function X(t,n,e){let r=null;return y((async()=>{const t=await async function(){const t=await fetch("https://www.reddit.com/r/wallpaper/top/.json?count=2?sort=new");return await t.json()}();e(0,r=t.data.children[0].data.url)})),[r]}return new class extends D{constructor(t){super(),q(this,t,X,W,c,{})}}({target:document.body})}();
//# sourceMappingURL=bundle.js.map
