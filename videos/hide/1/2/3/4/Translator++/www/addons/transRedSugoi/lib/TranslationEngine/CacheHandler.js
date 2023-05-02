"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheHandler = void 0;
class CacheHandler {
    constructor(wrapper) {
        this.fs = require('fs');
        this.cache = {};
        this.changed = false;
        this.busy = false;
        this.maximumCacheHitsOnLoad = 10;
        this.cacheDegradationLevel = 1;
        this.loaded = false;
        this.wrapper = wrapper;
    }
    addCache(key, translation) {
        this.cache[key] = [translation, 1];
        this.changed = true;
    }
    resetCache() {
        this.cache = {};
        this.changed = true;
    }
    hasCache(key) {
        return typeof this.cache[key] != 'undefined';
    }
    getCache(key) {
        this.cache[key][1] += 1;
        return this.cache[key][0];
    }
    getFilename(bak) {
        // Dirname is now THIS FILE'S folder!!!!
        return `${__dirname}/../../Cache${this.wrapper.getId()}.json${bak === true ? '.bak' : ''}`;
    }
    loadCache(bak) {
        if (this.loaded || !this.wrapper.optionCachePersistent.getValue()) {
            return;
        }
        if (this.fs.existsSync(this.getFilename(bak === true))) {
            try {
                let rawdata = this.fs.readFileSync(this.getFilename(bak === true));
                this.cache = {};
                let arr = JSON.parse(rawdata);
                if (Array.isArray(arr)) {
                    for (let i = 0; i < arr.length; i++) {
                        let aggregateHits = arr[i][2];
                        if (aggregateHits > this.maximumCacheHitsOnLoad) {
                            aggregateHits = this.maximumCacheHitsOnLoad;
                        }
                        else {
                            aggregateHits -= this.cacheDegradationLevel;
                            // We don't want to continually decrease it until it can no longer raise, we just want it to lose priority over time.
                            if (aggregateHits < 0) {
                                aggregateHits = 0;
                            }
                        }
                        this.cache[arr[i][0]] = [arr[i][1], aggregateHits];
                    }
                    this.loaded = true;
                }
                else if (typeof arr == 'object') {
                    // old version, code adapt
                    for (let key in arr) {
                        this.cache[key] = [arr[key], 1];
                    }
                    this.loaded = true;
                }
                this.changed = false;
            }
            catch (e) {
                this.loaded = false;
                this.cache = {};
                console.error('[RedPersistentCacheHandler] 缓存加载错误 ' +
                    this.wrapper.getId() +
                    '. Resetting.', e);
                if (bak !== true) {
                    console.warn('[RedPersistentCacheHandler] 正在尝试加载的备份缓存 ' +
                        this.wrapper.getId() +
                        '.');
                    this.loadCache(true);
                }
            }
        }
        else {
            console.warn('[RedPersistentCacheHandler] 找不到的缓存 ' + this.wrapper.getId() + '.');
            if (bak !== true) {
                console.warn('[RedPersistentCacheHandler] 正在尝试加载的备份缓存 ' +
                    this.wrapper.getId() +
                    '.');
                this.loadCache(true);
            }
        }
    }
    saveCache() {
        if (!this.wrapper.optionCachePersistent.getValue()) {
            return;
        }
        if (!this.changed) {
            console.warn('[RedPersistentCacheHandler] 未保存缓存，因为未进行任何更改。');
            return;
        }
        let arr = [];
        let maxSize = this.wrapper.optionCachePersistentSize.getValue() * 1024 * 1024;
        let size = 0;
        for (let key in this.cache) {
            arr.push([key, this.cache[key][0], this.cache[key][1]]);
            size += this.getSize(`"${key}":["${this.cache[key][0]}", ${this.cache[key][1]}`);
        }
        arr.sort((a, b) => {
            return b[2] - a[2];
        });
        while (size > maxSize && arr.length > 0) {
            let pop = arr.pop();
            size -= this.getSize(`"${pop[0]}":["${pop[1]}", ${pop[2]}`);
        }
        try {
            let write = () => {
                try {
                    this.fs.renameSync(this.getFilename(), this.getFilename(true));
                }
                catch (e) {
                    console.warn('[RedPersistentCacheHandler] C无法创建备份。文件不在吗？', e);
                }
                this.fs.writeFile(this.getFilename(), JSON.stringify(arr, undefined, 1), (err) => {
                    this.busy = false;
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log('[RedPersistentCacheHandler] 已成功保存缓存。');
                    }
                    let next = this.next;
                    if (typeof next == 'function') {
                        this.next = undefined;
                        next();
                    }
                    else {
                        this.busy = false;
                    }
                });
            };
            if (this.busy) {
                this.next = write;
            }
            else {
                this.busy = true;
                write();
            }
        }
        catch (e) {
            console.error('[RedPersistentCacheHandler] 无法保存的缓存 ' +
                this.wrapper.getId() +
                '.', e);
        }
    }
    getSize(cache) {
        //return (new TextEncoder().encode(cache)).length;
        return cache.length * 2; // it was too slow, we will assume: HALF IS JAPANESE HALF IS ENGLISH SO 2 BYTES PER CHARACTER, probably still a bit pessimistic, which is good enough of an approximation
    }
}
exports.CacheHandler = CacheHandler;
