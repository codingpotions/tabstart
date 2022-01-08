
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(claimed_nodes) {
            this.e = this.n = null;
            this.l = claimed_nodes;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                if (this.l) {
                    this.n = this.l;
                }
                else {
                    this.h(html);
                }
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    async function getTopWallpaper() {
      const response = await fetch("https://www.reddit.com/r/wallpaper/top/.json?count=2?sort=new");
      const data = await(response.json());
      return data;
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function asyncable(getter, setter = () => {}, stores = []) {
    	let resolve;
    	const initial = new Promise((res) => (resolve = res));

    	const derived$ = derived(stores, (values) => values);

    	const store$ = writable(initial, (set) => {
    		return derived$.subscribe(async (values = []) => {
    			let value = getter(...values);
    			if (value === undefined) return;
    			value = Promise.resolve(value);
    			set(value);
    			resolve(value);
    		});
    	});

    	async function set(newValue, oldValue) {
    		if (newValue === oldValue) return;
    		store$.set(Promise.resolve(newValue));
    		try {
    			await setter(newValue, oldValue);
    		} catch (err) {
    			store$.set(Promise.resolve(oldValue));
    			throw err;
    		}
    	}

    	return {
    		subscribe: store$.subscribe,
    		async update(reducer) {
    			if (!setter) return;
    			const oldValue = await get_store_value(store$);
    			const newValue = await reducer(shallowCopy(oldValue));
    			await set(newValue, oldValue);
    		},
    		async set(newValue) {
    			if (!setter) return;
    			const oldValue = await get_store_value(store$);
    			newValue = await newValue;
    			await set(newValue, oldValue);
    		},
    		get() {
    			return get_store_value(store$);
    		},
    	};
    }

    function shallowCopy(value) {
    	if (typeof value !== 'object' || value === null) return value;
    	return Array.isArray(value) ? [...value] : { ...value };
    }

    const settings = asyncable(
      async () => {
        let storedSettings = JSON.parse(localStorage.getItem("settings"));
        if (!storedSettings) {
          let savedSettings = await loadMostUsedSites();
          storedSettings = savedSettings;
        }
        return storedSettings;
      },
      (val) => saveSettings(val)
    );

    async function loadMostUsedSites() {
      return new Promise(async (resolve, reject) => {
        let sites = null;
        if (typeof browser === "undefined") {
          const savedSettings = saveSettings({ sites: new Array(10).fill({ url: "", icon: "" }) });
          return Promise.resolve(savedSettings);
        }
        const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
        if (isFirefox) {
          const mostVisitedURL = await browser.topSites.get();
          sites = parseSites(mostVisitedURL);
        } else if (chrome) {
          chrome.topSites.get((mostVisitedURL) => {
            sites = parseSites(mostVisitedURL);
          });
        }
        const savedSettings = saveSettings({ sites });
        resolve(savedSettings);
      });
    }

    function parseSites(sitesList) {
      return sitesList
        .map((site) => {
          const regex = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g;
          const domain = regex.exec(site.url)[1];
          let icon = site.icon;
          if (!icon) {
            icon = `https://logo.clearbit.com/${domain}?s=256`;
          }
          return { ...site, domain, icon };
        })
        .filter((site) => !site.domain.includes("localhost"));
    }

    function saveSettings(settingsToSave) {
      settingsToSave = defaultSettings(settingsToSave);
      localStorage.setItem("settings", JSON.stringify(settingsToSave));
      return settingsToSave;
    }

    function defaultSettings(oldSettings = {}) {
      oldSettings = setDefaultValue(oldSettings, "clockSize", 6);
      oldSettings = setDefaultValue(oldSettings, "sitesIconSize", 128);
      oldSettings = setDefaultValue(oldSettings, "sitesCount", 6);
      oldSettings = setDefaultValue(oldSettings, "sites", []);
      return oldSettings;
    }

    function setDefaultValue(originalObject, key, defaultValue) {
      let newObject = originalObject || {};
      if (!newObject[key]) {
        newObject[key] = defaultValue;
      }
      return newObject;
    }

    /* src/Clock.svelte generated by Svelte v3.38.3 */
    const file$4 = "src/Clock.svelte";

    function create_fragment$4(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(/*h*/ ctx[0]);
    			t1 = text(":");
    			t2 = text(/*m*/ ctx[1]);
    			t3 = text(":");
    			t4 = text(/*s*/ ctx[2]);
    			attr_dev(h2, "class", "clock svelte-p6wtmt");
    			set_style(h2, "font-size", /*clockSize*/ ctx[3] + "rem");
    			add_location(h2, file$4, 43, 0, 925);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			append_dev(h2, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*h*/ 1) set_data_dev(t0, /*h*/ ctx[0]);
    			if (dirty & /*m*/ 2) set_data_dev(t2, /*m*/ ctx[1]);
    			if (dirty & /*s*/ 4) set_data_dev(t4, /*s*/ ctx[2]);

    			if (dirty & /*clockSize*/ 8) {
    				set_style(h2, "font-size", /*clockSize*/ ctx[3] + "rem");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function addZero(number) {
    	if (number < 10) {
    		return "0" + number;
    	}

    	return number.toString();
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let clockSize;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Clock", slots, []);
    	let h = "00";
    	let m = "00";
    	let s = "00";
    	let settingsValue = { sites: [] };
    	settings.subscribe(async value => $$invalidate(4, settingsValue = await value));

    	const unsubscribe = settings.subscribe(async settingsStore => {
    		const newValue = await settingsStore;
    		$$invalidate(4, settingsValue = newValue);
    	});

    	onDestroy(unsubscribe);

    	function startClock() {
    		const now = new Date();
    		$$invalidate(0, h = addZero(now.getHours()));
    		$$invalidate(1, m = addZero(now.getMinutes()));
    		$$invalidate(2, s = addZero(now.getSeconds()));
    	}

    	onMount(async () => {
    		startClock();
    		setInterval(() => startClock(), 1 * 1000);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		settings,
    		getTopWallpaper,
    		onMount,
    		onDestroy,
    		h,
    		m,
    		s,
    		settingsValue,
    		unsubscribe,
    		startClock,
    		addZero,
    		clockSize
    	});

    	$$self.$inject_state = $$props => {
    		if ("h" in $$props) $$invalidate(0, h = $$props.h);
    		if ("m" in $$props) $$invalidate(1, m = $$props.m);
    		if ("s" in $$props) $$invalidate(2, s = $$props.s);
    		if ("settingsValue" in $$props) $$invalidate(4, settingsValue = $$props.settingsValue);
    		if ("clockSize" in $$props) $$invalidate(3, clockSize = $$props.clockSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*settingsValue*/ 16) {
    			$$invalidate(3, clockSize = settingsValue.clockSize);
    		}
    	};

    	return [h, m, s, clockSize, settingsValue];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Sites.svelte generated by Svelte v3.38.3 */
    const file$3 = "src/Sites.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (20:0) {#if sites.length}
    function create_if_block$3(ctx) {
    	let div;
    	let each_value = /*sites*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "sites svelte-iuny4y");
    			set_style(div, "grid-template-columns", "repeat(auto-fit, minmax(24px, " + /*sitesIconSize*/ ctx[1] + "px))");
    			add_location(div, file$3, 20, 2, 532);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sites, sitesIconSize*/ 3) {
    				each_value = /*sites*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*sitesIconSize*/ 2) {
    				set_style(div, "grid-template-columns", "repeat(auto-fit, minmax(24px, " + /*sitesIconSize*/ ctx[1] + "px))");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(20:0) {#if sites.length}",
    		ctx
    	});

    	return block;
    }

    // (25:4) {#each sites as site}
    function create_each_block$1(ctx) {
    	let a;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			t = space();
    			set_style(img, "width", /*sitesIconSize*/ ctx[1] + "px");
    			set_style(img, "height", /*sitesIconSize*/ ctx[1] + "px");
    			if (img.src !== (img_src_value = /*site*/ ctx[4].icon)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*site*/ ctx[4].title);
    			attr_dev(img, "class", "svelte-iuny4y");
    			add_location(img, file$3, 26, 8, 705);
    			attr_dev(a, "href", a_href_value = /*site*/ ctx[4].url);
    			attr_dev(a, "class", "svelte-iuny4y");
    			add_location(a, file$3, 25, 6, 677);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sitesIconSize*/ 2) {
    				set_style(img, "width", /*sitesIconSize*/ ctx[1] + "px");
    			}

    			if (dirty & /*sitesIconSize*/ 2) {
    				set_style(img, "height", /*sitesIconSize*/ ctx[1] + "px");
    			}

    			if (dirty & /*sites*/ 1 && img.src !== (img_src_value = /*site*/ ctx[4].icon)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*sites*/ 1 && img_alt_value !== (img_alt_value = /*site*/ ctx[4].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*sites*/ 1 && a_href_value !== (a_href_value = /*site*/ ctx[4].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(25:4) {#each sites as site}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*sites*/ ctx[0].length && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*sites*/ ctx[0].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let sites;
    	let sitesIconSize;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sites", slots, []);
    	let settingsValue = { sites: [] };
    	settings.subscribe(async value => $$invalidate(2, settingsValue = await value));

    	const unsubscribe = settings.subscribe(async settingsStore => {
    		const newValue = await settingsStore;
    		$$invalidate(2, settingsValue = newValue);
    	});

    	onDestroy(unsubscribe);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sites> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		settings,
    		onDestroy,
    		settingsValue,
    		unsubscribe,
    		sites,
    		sitesIconSize
    	});

    	$$self.$inject_state = $$props => {
    		if ("settingsValue" in $$props) $$invalidate(2, settingsValue = $$props.settingsValue);
    		if ("sites" in $$props) $$invalidate(0, sites = $$props.sites);
    		if ("sitesIconSize" in $$props) $$invalidate(1, sitesIconSize = $$props.sitesIconSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*settingsValue*/ 4) {
    			$$invalidate(0, sites = settingsValue.sites.slice(0, settingsValue.sitesCount));
    		}

    		if ($$self.$$.dirty & /*settingsValue*/ 4) {
    			$$invalidate(1, sitesIconSize = settingsValue.sitesIconSize);
    		}
    	};

    	return [sites, sitesIconSize, settingsValue];
    }

    class Sites extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sites",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    function linearMap (value, oldMin, oldMax, newMin, newMax) {
      return (value - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin;
    }

    /* src/Slider.svelte generated by Svelte v3.38.3 */
    const file$2 = "src/Slider.svelte";

    // (52:2) {#if label }
    function create_if_block_1$1(ctx) {
    	let label_1;
    	let t;
    	let label_1_for_value;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[3]);
    			attr_dev(label_1, "for", label_1_for_value = "#" + /*id*/ ctx[5]);
    			attr_dev(label_1, "class", "svelte-6sxepo");
    			add_location(label_1, file$2, 52, 4, 1273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 8) set_data_dev(t, /*label*/ ctx[3]);

    			if (dirty & /*id*/ 32 && label_1_for_value !== (label_1_for_value = "#" + /*id*/ ctx[5])) {
    				attr_dev(label_1, "for", label_1_for_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(52:2) {#if label }",
    		ctx
    	});

    	return block;
    }

    // (55:2) {#if value }
    function create_if_block$2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*value*/ ctx[0]);
    			attr_dev(div, "class", "current-value svelte-6sxepo");
    			set_style(div, "left", /*currentValuePercent*/ ctx[6]() + "%");
    			add_location(div, file$2, 55, 4, 1336);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 1) set_data_dev(t, /*value*/ ctx[0]);

    			if (dirty & /*currentValuePercent*/ 64) {
    				set_style(div, "left", /*currentValuePercent*/ ctx[6]() + "%");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(55:2) {#if value }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let t0;
    	let t1;
    	let input;
    	let t2;
    	let div2;
    	let div0;
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let mounted;
    	let dispose;
    	let if_block0 = /*label*/ ctx[3] && create_if_block_1$1(ctx);
    	let if_block1 = /*value*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div2 = element("div");
    			div0 = element("div");
    			t3 = text(/*min*/ ctx[1]);
    			t4 = space();
    			div1 = element("div");
    			t5 = text(/*max*/ ctx[2]);
    			attr_dev(input, "id", /*id*/ ctx[5]);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", /*min*/ ctx[1]);
    			attr_dev(input, "max", /*max*/ ctx[2]);
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "class", "slider svelte-6sxepo");
    			add_location(input, file$2, 57, 2, 1427);
    			attr_dev(div0, "class", "min");
    			add_location(div0, file$2, 59, 4, 1586);
    			attr_dev(div1, "class", "max");
    			add_location(div1, file$2, 60, 4, 1619);
    			attr_dev(div2, "class", "values svelte-6sxepo");
    			add_location(div2, file$2, 58, 2, 1561);
    			attr_dev(div3, "class", "slider-container svelte-6sxepo");
    			add_location(div3, file$2, 50, 0, 1223);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t0);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div3, t1);
    			append_dev(div3, input);
    			/*input_binding*/ ctx[8](input);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, t5);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*sliderHandler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div3, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*value*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div3, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*id*/ 32) {
    				attr_dev(input, "id", /*id*/ ctx[5]);
    			}

    			if (dirty & /*min*/ 2) {
    				attr_dev(input, "min", /*min*/ ctx[1]);
    			}

    			if (dirty & /*max*/ 4) {
    				attr_dev(input, "max", /*max*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (dirty & /*min*/ 2) set_data_dev(t3, /*min*/ ctx[1]);
    			if (dirty & /*max*/ 4) set_data_dev(t5, /*max*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*input_binding*/ ctx[8](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let id;
    	let currentValuePercent;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Slider", slots, []);
    	const dispatch = createEventDispatcher();
    	let slider = null;
    	let { value = 0 } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 10 } = $$props;
    	let { label = "" } = $$props;

    	onMount(() => {
    		updateValue();
    	});

    	

    	function updateValue(newValue) {
    		if (slider) {
    			const srcElement = slider;
    			const min = parseInt(srcElement.min);
    			const max = parseInt(srcElement.max);
    			const value = newValue ? newValue : parseInt(srcElement.value);
    			const percent = (value - min) / (max - min) * 100;
    			srcElement.style.background = "linear-gradient(to right, #82CFD0 0%, #82CFD0 " + percent + "%, #fff " + percent + "%, white 100%)";
    		}
    	}

    	function sliderHandler(e) {
    		updateValue();
    		dispatch("updated", { value: e.srcElement.value });
    	}

    	const writable_props = ["value", "min", "max", "label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Slider> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			slider = $$value;
    			$$invalidate(4, slider);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("min" in $$props) $$invalidate(1, min = $$props.min);
    		if ("max" in $$props) $$invalidate(2, max = $$props.max);
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		linearMap,
    		dispatch,
    		slider,
    		value,
    		min,
    		max,
    		label,
    		updateValue,
    		sliderHandler,
    		id,
    		currentValuePercent
    	});

    	$$self.$inject_state = $$props => {
    		if ("slider" in $$props) $$invalidate(4, slider = $$props.slider);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("min" in $$props) $$invalidate(1, min = $$props.min);
    		if ("max" in $$props) $$invalidate(2, max = $$props.max);
    		if ("label" in $$props) $$invalidate(3, label = $$props.label);
    		if ("id" in $$props) $$invalidate(5, id = $$props.id);
    		if ("currentValuePercent" in $$props) $$invalidate(6, currentValuePercent = $$props.currentValuePercent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*label*/ 8) {
    			$$invalidate(5, id = "slider-" + label.replace(/\s+/g, "-").toLowerCase());
    		}

    		if ($$self.$$.dirty & /*value, min, max*/ 7) {
    			$$invalidate(6, currentValuePercent = () => {
    				const currentPercent = (value - min) / (max - min) * 100;

    				// TODO: Magic number
    				return linearMap(currentPercent, 0, 100, 1.1, 98.9);
    			});
    		}

    		if ($$self.$$.dirty & /*value*/ 1) {
    			if (value) {
    				updateValue(value);
    			}
    		}
    	};

    	return [
    		value,
    		min,
    		max,
    		label,
    		slider,
    		id,
    		currentValuePercent,
    		sliderHandler,
    		input_binding
    	];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 0, min: 1, max: 2, label: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get value() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Settings.svelte generated by Svelte v3.38.3 */
    const file$1 = "src/Settings.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (70:12) {#if sites && sites[i]}
    function create_if_block$1(ctx) {
    	let div;
    	let input0;
    	let input0_value_value;
    	let t0;
    	let input1;
    	let input1_value_value;
    	let t1;
    	let mounted;
    	let dispose;

    	function input_handler(...args) {
    		return /*input_handler*/ ctx[8](/*i*/ ctx[14], ...args);
    	}

    	function input_handler_1(...args) {
    		return /*input_handler_1*/ ctx[9](/*i*/ ctx[14], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			attr_dev(input0, "type", "text");
    			input0.value = input0_value_value = /*settingsValue*/ ctx[0].sites[/*i*/ ctx[14]].url;
    			attr_dev(input0, "placeholder", "Url");
    			attr_dev(input0, "class", "svelte-1a0wdsc");
    			add_location(input0, file$1, 71, 16, 1983);
    			attr_dev(input1, "type", "text");
    			input1.value = input1_value_value = /*settingsValue*/ ctx[0].sites[/*i*/ ctx[14]].icon;
    			attr_dev(input1, "placeholder", "Icon");
    			attr_dev(input1, "class", "svelte-1a0wdsc");
    			add_location(input1, file$1, 77, 16, 2200);
    			attr_dev(div, "class", "form-site svelte-1a0wdsc");
    			add_location(div, file$1, 70, 14, 1943);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			append_dev(div, t0);
    			append_dev(div, input1);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", input_handler, false, false, false),
    					listen_dev(input1, "input", input_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*settingsValue*/ 1 && input0_value_value !== (input0_value_value = /*settingsValue*/ ctx[0].sites[/*i*/ ctx[14]].url) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*settingsValue*/ 1 && input1_value_value !== (input1_value_value = /*settingsValue*/ ctx[0].sites[/*i*/ ctx[14]].icon) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(70:12) {#if sites && sites[i]}",
    		ctx
    	});

    	return block;
    }

    // (69:10) {#each Array(10) as _, i}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*sites*/ ctx[1] && /*sites*/ ctx[1][/*i*/ ctx[14]] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*sites*/ ctx[1] && /*sites*/ ctx[1][/*i*/ ctx[14]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(69:10) {#each Array(10) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div5;
    	let div4;
    	let h2;
    	let t1;
    	let div3;
    	let div2;
    	let slider0;
    	let t2;
    	let slider1;
    	let t3;
    	let slider2;
    	let t4;
    	let div1;
    	let div0;
    	let t6;
    	let current;

    	slider0 = new Slider({
    			props: {
    				class: "form-control",
    				label: "Clock size",
    				value: /*settingsValue*/ ctx[0].clockSize,
    				min: 1
    			},
    			$$inline: true
    		});

    	slider0.$on("updated", /*updated_handler*/ ctx[5]);

    	slider1 = new Slider({
    			props: {
    				class: "form-control",
    				label: "Number of sites",
    				value: /*settingsValue*/ ctx[0].sitesCount,
    				min: 1
    			},
    			$$inline: true
    		});

    	slider1.$on("updated", /*updated_handler_1*/ ctx[6]);

    	slider2 = new Slider({
    			props: {
    				class: "form-control",
    				label: "Sites icon size",
    				value: /*settingsValue*/ ctx[0].sitesIconSize,
    				min: 24,
    				max: 256
    			},
    			$$inline: true
    		});

    	slider2.$on("updated", /*updated_handler_2*/ ctx[7]);
    	let each_value = Array(10);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Settings";
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			create_component(slider0.$$.fragment);
    			t2 = space();
    			create_component(slider1.$$.fragment);
    			t3 = space();
    			create_component(slider2.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Current sites";
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "title svelte-1a0wdsc");
    			add_location(h2, file$1, 41, 4, 1011);
    			attr_dev(div0, "class", "form-title svelte-1a0wdsc");
    			add_location(div0, file$1, 67, 10, 1813);
    			attr_dev(div1, "class", "form-control");
    			add_location(div1, file$1, 66, 8, 1776);
    			attr_dev(div2, "class", "left svelte-1a0wdsc");
    			add_location(div2, file$1, 43, 6, 1075);
    			attr_dev(div3, "class", "columns");
    			add_location(div3, file$1, 42, 4, 1047);
    			attr_dev(div4, "class", "container svelte-1a0wdsc");
    			add_location(div4, file$1, 40, 2, 983);
    			attr_dev(div5, "class", "settings svelte-1a0wdsc");
    			add_location(div5, file$1, 39, 0, 958);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, h2);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			mount_component(slider0, div2, null);
    			append_dev(div2, t2);
    			mount_component(slider1, div2, null);
    			append_dev(div2, t3);
    			mount_component(slider2, div2, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const slider0_changes = {};
    			if (dirty & /*settingsValue*/ 1) slider0_changes.value = /*settingsValue*/ ctx[0].clockSize;
    			slider0.$set(slider0_changes);
    			const slider1_changes = {};
    			if (dirty & /*settingsValue*/ 1) slider1_changes.value = /*settingsValue*/ ctx[0].sitesCount;
    			slider1.$set(slider1_changes);
    			const slider2_changes = {};
    			if (dirty & /*settingsValue*/ 1) slider2_changes.value = /*settingsValue*/ ctx[0].sitesIconSize;
    			slider2.$set(slider2_changes);

    			if (dirty & /*settingsValue, iconHandler, domainHandler, sites*/ 27) {
    				each_value = Array(10);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slider0.$$.fragment, local);
    			transition_in(slider1.$$.fragment, local);
    			transition_in(slider2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slider0.$$.fragment, local);
    			transition_out(slider1.$$.fragment, local);
    			transition_out(slider2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(slider0);
    			destroy_component(slider1);
    			destroy_component(slider2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let sites;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Settings", slots, []);
    	let settingsValue = {};

    	const unsubscribe = settings.subscribe(async settingsStore => {
    		const newValue = await settingsStore;
    		$$invalidate(0, settingsValue = newValue);
    	});

    	onDestroy(unsubscribe);

    	function storeNumericValue(e, key) {
    		const newValue = parseInt(e.detail.value);
    		settings.update(n => ({ ...n, [key]: newValue }));
    	}

    	function domainHandler(e, index) {
    		const newURL = e.srcElement.value;
    		$$invalidate(1, sites[index] = { ...sites[index], url: newURL }, sites);
    		storeSites();
    	}

    	function iconHandler(e, index) {
    		const newIcon = e.srcElement.value;
    		$$invalidate(1, sites[index] = { ...sites[index], icon: newIcon }, sites);
    		storeSites();
    	}

    	function storeSites() {
    		$$invalidate(1, sites = parseSites(sites));
    		settings.update(n => ({ ...n, sites }));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const updated_handler = e => storeNumericValue(e, "clockSize");
    	const updated_handler_1 = e => storeNumericValue(e, "sitesCount");
    	const updated_handler_2 = e => storeNumericValue(e, "sitesIconSize");
    	const input_handler = (i, e) => domainHandler(e, i);
    	const input_handler_1 = (i, e) => iconHandler(e, i);

    	$$self.$capture_state = () => ({
    		Slider,
    		settings,
    		parseSites,
    		onDestroy,
    		settingsValue,
    		unsubscribe,
    		storeNumericValue,
    		domainHandler,
    		iconHandler,
    		storeSites,
    		sites
    	});

    	$$self.$inject_state = $$props => {
    		if ("settingsValue" in $$props) $$invalidate(0, settingsValue = $$props.settingsValue);
    		if ("sites" in $$props) $$invalidate(1, sites = $$props.sites);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*settingsValue*/ 1) {
    			$$invalidate(1, sites = settingsValue.sites);
    		}
    	};

    	return [
    		settingsValue,
    		sites,
    		storeNumericValue,
    		domainHandler,
    		iconHandler,
    		updated_handler,
    		updated_handler_1,
    		updated_handler_2,
    		input_handler,
    		input_handler_1
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const gear = `<svg height="24" viewBox="0 0 512 512" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m272.066 512h-32.133c-25.989 0-47.134-21.144-47.134-47.133v-10.871c-11.049-3.53-21.784-7.986-32.097-13.323l-7.704 7.704c-18.659 18.682-48.548 18.134-66.665-.007l-22.711-22.71c-18.149-18.129-18.671-48.008.006-66.665l7.698-7.698c-5.337-10.313-9.792-21.046-13.323-32.097h-10.87c-25.988 0-47.133-21.144-47.133-47.133v-32.134c0-25.989 21.145-47.133 47.134-47.133h10.87c3.531-11.05 7.986-21.784 13.323-32.097l-7.704-7.703c-18.666-18.646-18.151-48.528.006-66.665l22.713-22.712c18.159-18.184 48.041-18.638 66.664.006l7.697 7.697c10.313-5.336 21.048-9.792 32.097-13.323v-10.87c0-25.989 21.144-47.133 47.134-47.133h32.133c25.989 0 47.133 21.144 47.133 47.133v10.871c11.049 3.53 21.784 7.986 32.097 13.323l7.704-7.704c18.659-18.682 48.548-18.134 66.665.007l22.711 22.71c18.149 18.129 18.671 48.008-.006 66.665l-7.698 7.698c5.337 10.313 9.792 21.046 13.323 32.097h10.87c25.989 0 47.134 21.144 47.134 47.133v32.134c0 25.989-21.145 47.133-47.134 47.133h-10.87c-3.531 11.05-7.986 21.784-13.323 32.097l7.704 7.704c18.666 18.646 18.151 48.528-.006 66.665l-22.713 22.712c-18.159 18.184-48.041 18.638-66.664-.006l-7.697-7.697c-10.313 5.336-21.048 9.792-32.097 13.323v10.871c0 25.987-21.144 47.131-47.134 47.131zm-106.349-102.83c14.327 8.473 29.747 14.874 45.831 19.025 6.624 1.709 11.252 7.683 11.252 14.524v22.148c0 9.447 7.687 17.133 17.134 17.133h32.133c9.447 0 17.134-7.686 17.134-17.133v-22.148c0-6.841 4.628-12.815 11.252-14.524 16.084-4.151 31.504-10.552 45.831-19.025 5.895-3.486 13.4-2.538 18.243 2.305l15.688 15.689c6.764 6.772 17.626 6.615 24.224.007l22.727-22.726c6.582-6.574 6.802-17.438.006-24.225l-15.695-15.695c-4.842-4.842-5.79-12.348-2.305-18.242 8.473-14.326 14.873-29.746 19.024-45.831 1.71-6.624 7.684-11.251 14.524-11.251h22.147c9.447 0 17.134-7.686 17.134-17.133v-32.134c0-9.447-7.687-17.133-17.134-17.133h-22.147c-6.841 0-12.814-4.628-14.524-11.251-4.151-16.085-10.552-31.505-19.024-45.831-3.485-5.894-2.537-13.4 2.305-18.242l15.689-15.689c6.782-6.774 6.605-17.634.006-24.225l-22.725-22.725c-6.587-6.596-17.451-6.789-24.225-.006l-15.694 15.695c-4.842 4.843-12.35 5.791-18.243 2.305-14.327-8.473-29.747-14.874-45.831-19.025-6.624-1.709-11.252-7.683-11.252-14.524v-22.15c0-9.447-7.687-17.133-17.134-17.133h-32.133c-9.447 0-17.134 7.686-17.134 17.133v22.148c0 6.841-4.628 12.815-11.252 14.524-16.084 4.151-31.504 10.552-45.831 19.025-5.896 3.485-13.401 2.537-18.243-2.305l-15.688-15.689c-6.764-6.772-17.627-6.615-24.224-.007l-22.727 22.726c-6.582 6.574-6.802 17.437-.006 24.225l15.695 15.695c4.842 4.842 5.79 12.348 2.305 18.242-8.473 14.326-14.873 29.746-19.024 45.831-1.71 6.624-7.684 11.251-14.524 11.251h-22.148c-9.447.001-17.134 7.687-17.134 17.134v32.134c0 9.447 7.687 17.133 17.134 17.133h22.147c6.841 0 12.814 4.628 14.524 11.251 4.151 16.085 10.552 31.505 19.024 45.831 3.485 5.894 2.537 13.4-2.305 18.242l-15.689 15.689c-6.782 6.774-6.605 17.634-.006 24.225l22.725 22.725c6.587 6.596 17.451 6.789 24.225.006l15.694-15.695c3.568-3.567 10.991-6.594 18.244-2.304z"/><path d="m256 367.4c-61.427 0-111.4-49.974-111.4-111.4s49.973-111.4 111.4-111.4 111.4 49.974 111.4 111.4-49.973 111.4-111.4 111.4zm0-192.8c-44.885 0-81.4 36.516-81.4 81.4s36.516 81.4 81.4 81.4 81.4-36.516 81.4-81.4-36.515-81.4-81.4-81.4z"/></svg>`;
    const close = `<svg height="24" viewBox="0 0 329.26933 329" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0"/></svg>`;

    const emojis = [
      '😄','😃','😀','😊','☺','😉','😍','😘','😚','😗','😙','😜','😝','😛','😳','😁','😔','😌','😒','😞','😣','😢','😂','😭','😪','😥','😰','😅','😓','😩','😫','😨','😱','😠','😡','😤','😖','😆','😋','😷','😎','😴','😵','😲','😟','😦','😧','😈','👿','😮','😬','😐','😕','😯','😶','😇','😏','😑','👲','👳','👮','👷','💂','👶','👦','👧','👨','👩','👴','👵','👱','👼','👸','😺','😸','😻','😽','😼','🙀','😿','😹','😾','👹','👺','🙈','🙉','🙊','💀','👽','💩','🔥','✨','🌟','💫','💥','💢','💦','💧','💤','💨','👂','👀','👃','👅','👄','👍','👎','👌','👊','✊','✌','👋','✋','👐','👆','👇','👉','👈','🙌','🙏','☝','👏','💪','🚶','🏃','💃','👫','👪','👬','👭','💏','💑','👯','🙆','🙅','💁','🙋','💆','💇','💅','👰','🙎','🙍','🙇','🎩','👑','👒','👟','👞','👡','👠','👢','👕','👔','👚','👗','🎽','👖','👘','👙','💼','👜','👝','👛','👓','🎀','🌂','💄','💛','💙','💜','💚','❤','💔','💗','💓','💕','💖','💞','💘','💌','💋','💍','💎','👤','👥','💬','👣','💭','🐶','🐺','🐱','🐭','🐹','🐰','🐸','🐯','🐨','🐻','🐷','🐽','🐮','🐗','🐵','🐒','🐴','🐑','🐘','🐼','🐧','🐦','🐤','🐥','🐣','🐔','🐍','🐢','🐛','🐝','🐜','🐞','🐌','🐙','🐚','🐠','🐟','🐬','🐳','🐋','🐄','🐏','🐀','🐃','🐅','🐇','🐉','🐎','🐐','🐓','🐕','🐖','🐁','🐂','🐲','🐡','🐊','🐫','🐪','🐆','🐈','🐩','🐾','💐','🌸','🌷','🍀','🌹','🌻','🌺','🍁','🍃','🍂','🌿','🌾','🍄','🌵','🌴','🌲','🌳','🌰','🌱','🌼','🌐','🌞','🌝','🌚','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌜','🌛','🌙','🌍','🌎','🌏','🌋','🌌','🌠','⭐','☀','⛅','☁','⚡','☔','❄','⛄','🌀','🌁','🌈','🌊','🎍','💝','🎎','🎒','🎓','🎏','🎆','🎇','🎐','🎑','🎃','👻','🎅','🎄','🎁','🎋','🎉','🎊','🎈','🎌','🔮','🎥','📷','📹','📼','💿','📀','💽','💾','💻','📱','☎','📞','📟','📠','📡','📺','📻','🔊','🔉','🔈','🔇','🔔','🔕','📢','📣','⏳','⌛','⏰','⌚','🔓','🔒','🔏','🔐','🔑','🔎','💡','🔦','🔆','🔅','🔌','🔋','🔍','🛁','🛀','🚿','🚽','🔧','🔩','🔨','🚪','🚬','💣','🔫','🔪','💊','💉','💰','💴','💵','💷','💶','💳','💸','📲','📧','📥','📤','✉','📩','📨','📯','📫','📪','📬','📭','📮','📦','📝','📄','📃','📑','📊','📈','📉','📜','📋','📅','📆','📇','📁','📂','✂','📌','📎','✒','✏','📏','📐','📕','📗','📘','📙','📓','📔','📒','📚','📖','🔖','📛','🔬','🔭','📰','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎹','🎻','🎺','🎷','🎸','👾','🎮','🃏','🎴','🀄','🎲','🎯','🏈','🏀','⚽','⚾','🎾','🎱','🏉','🎳','⛳','🚵','🚴','🏁','🏇','🏆','🎿','🏂','🏊','🏄','🎣','☕','🍵','🍶','🍼','🍺','🍻','🍸','🍹','🍷','🍴','🍕','🍔','🍟','🍗','🍖','🍝','🍛','🍤','🍱','🍣','🍥','🍙','🍘','🍚','🍜','🍲','🍢','🍡','🍳','🍞','🍩','🍮','🍦','🍨','🍧','🎂','🍰','🍪','🍫','🍬','🍭','🍯','🍎','🍏','🍊','🍋','🍒','🍇','🍉','🍓','🍑','🍈','🍌','🍐','🍍','🍠','🍆','🍅','🌽','🏠','🏡','🏫','🏢','🏣','🏥','🏦','🏪','🏩','🏨','💒','⛪','🏬','🏤','🌇','🌆','🏯','🏰','⛺','🏭','🗼','🗾','🗻','🌄','🌅','🌃','🗽','🌉','🎠','🎡','⛲','🎢','🚢','⛵','🚤','🚣','⚓','🚀','✈','💺','🚁','🚂','🚊','🚉','🚞','🚆','🚄','🚅','🚈','🚇','🚝','🚋','🚃','🚎','🚌','🚍','🚙','🚘','🚗','🚕','🚖','🚛','🚚','🚨','🚓','🚔','🚒','🚑','🚐','🚲','🚡','🚟','🚠','🚜','💈','🚏','🎫','🚦','🚥','⚠','🚧','🔰','⛽','🏮','🎰','♨','🗿','🎪','🎭','📍','🚩','⬆','⬇','⬅','➡','🔠','🔡','🔤','↗','↖','↘','↙','↔','↕','🔄','◀','▶','🔼','🔽','↩','↪','ℹ','⏪','⏩','⏫','⏬','⤵','⤴','🆗','🔀','🔁','🔂','🆕','🆙','🆒','🆓','🆖','📶','🎦','🈁','🈯','🈳','🈵','🈴','🈲','🉐','🈹','🈺','🈶','🈚','🚻','🚹','🚺','🚼','🚾','🚰','🚮','🅿','♿','🚭','🈷','🈸','🈂','Ⓜ','🛂','🛄','🛅','🛃','🉑','㊙','㊗','🆑','🆘','🆔','🚫','🔞','📵','🚯','🚱','🚳','🚷','🚸','⛔','✳','❇','❎','✅','✴','💟','🆚','📳','📴','🅰','🅱','🆎','🅾','💠','➿','♻','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔯','🏧','💹','💲','💱','©','®','™','〽','〰','🔝','🔚','🔙','🔛','🔜','❌','⭕','❗','❓','❕','❔','🔃','🕛','🕧','🕐','🕜','🕑','🕝','🕒','🕞','🕓','🕟','🕔','🕠','🕕','🕖','🕗','🕘','🕙','🕚','🕡','🕢','🕣','🕤','🕥','🕦','➕','➖','➗','♠','♥','♣','♦','💮','💯','☑','🔘','🔗','➰','🔱','🔲','🔳','◼','◾','◽','▪','⬜','⬛','⚫','⚪','🔴','🔵','🔶','🔷'
    ];

    /* src/App.svelte generated by Svelte v3.38.3 */
    const file = "src/App.svelte";

    // (30:6) {:else }
    function create_else_block_1(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag();
    			html_anchor = empty();
    			html_tag.a = html_anchor;
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(close, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(30:6) {:else }",
    		ctx
    	});

    	return block;
    }

    // (28:6) {#if !isSettingsOpen }
    function create_if_block_1(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag();
    			html_anchor = empty();
    			html_tag.a = html_anchor;
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(gear, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(28:6) {#if !isSettingsOpen }",
    		ctx
    	});

    	return block;
    }

    // (43:4) {:else }
    function create_else_block(ctx) {
    	let settings;
    	let current;
    	settings = new Settings({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(settings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:4) {:else }",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#if !isSettingsOpen }
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let clock;
    	let t;
    	let div1;
    	let sites;
    	let current;
    	clock = new Clock({ $$inline: true });
    	sites = new Sites({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(clock.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(sites.$$.fragment);
    			attr_dev(div0, "class", "clock-container svelte-o2y2xf");
    			add_location(div0, file, 35, 8, 963);
    			attr_dev(div1, "class", "sites-container svelte-o2y2xf");
    			add_location(div1, file, 38, 8, 1036);
    			attr_dev(div2, "class", "content svelte-o2y2xf");
    			add_location(div2, file, 34, 6, 933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(clock, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(sites, div1, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clock.$$.fragment, local);
    			transition_in(sites.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clock.$$.fragment, local);
    			transition_out(sites.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(clock);
    			destroy_component(sites);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:4) {#if !isSettingsOpen }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div1;
    	let div0;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*isSettingsOpen*/ ctx[1]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*isSettingsOpen*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t = space();
    			if_block1.c();
    			attr_dev(div0, "class", "settings-icon svelte-o2y2xf");
    			add_location(div0, file, 26, 4, 731);
    			attr_dev(div1, "class", "bg svelte-o2y2xf");
    			set_style(div1, "background-image", "url('" + /*bg*/ ctx[0] + "')");
    			add_location(div1, file, 25, 2, 671);
    			attr_dev(main, "class", "svelte-o2y2xf");
    			add_location(main, file, 24, 0, 662);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			if_block0.m(div0, null);
    			append_dev(div1, t);
    			if_blocks[current_block_type_index].m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*toggleOpenSettings*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div1, null);
    			}

    			if (!current || dirty & /*bg*/ 1) {
    				set_style(div1, "background-image", "url('" + /*bg*/ ctx[0] + "')");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block0.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let bg = null;
    	let isSettingsOpen = false;

    	function toggleOpenSettings() {
    		$$invalidate(1, isSettingsOpen = !isSettingsOpen);
    	}

    	onMount(async () => {
    		const bgResponse = await getTopWallpaper();
    		$$invalidate(0, bg = bgResponse.data.children[0].data.url);
    		document.title = "New tab " + emojis[Math.floor(Math.random() * emojis.length)];
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getTopWallpaper,
    		onMount,
    		Clock,
    		Sites,
    		Settings,
    		gear,
    		close,
    		emojis,
    		bg,
    		isSettingsOpen,
    		toggleOpenSettings
    	});

    	$$self.$inject_state = $$props => {
    		if ("bg" in $$props) $$invalidate(0, bg = $$props.bg);
    		if ("isSettingsOpen" in $$props) $$invalidate(1, isSettingsOpen = $$props.isSettingsOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bg, isSettingsOpen, toggleOpenSettings];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
