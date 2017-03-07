const fs = require('fs');

function size(filename) {
    return new Promise((resolve, reject) => {
        fs.stat(filename, (err, stat) => {
            if (err)
                reject(err);
            else
                resolve(stat.size);
        });
    });
}

function toThunk(fn) {
    if (Array.isArray(fn)) {
        const results = [];
        // 等待完成的任务
        let pending = fn.length;
        return function (cb) {
            let finished = false;
            fn.forEach(function (func, index) {
                if (finished) {
                    return;
                }
                func = toThunk(func);
                func.call(this, function (err, res) {
                    if (err) {
                        finished = true;
                        cb(err);
                    } else {
                        results[index] = res;
                        // 如果再无任务，才返回`results`
                        if (--pending === 0) {
                            cb(null, results);
                        }
                    }
                });
            })
        }
    } else if (isPromise(fn)) {
        return function (cb) {
            return fn.then(function (res) {
                cb(null, res);
            }, function (err) {
                cb(err);
            })
        }
    }
}

function isPromise(fn) {
    return fn && typeof fn.then === 'function';
}

function runGenerator(gen) {
    // 先获得迭代器
    const it = gen();
    // 驱动generator运行
    next();

    function next(err, res) {
        const { value, done } = it.next(res);
        if (done) {
            cb(null, value);
        }

        if (err) {
            if (done) {
                cb(err);
            } else {
                return it.throw(err);
            }
        }


        thunk = toThunk(value);
        if (typeof thunk === 'function') {
            thunk.call(this, function (err, res) {
                if (err) {
                    next(err, null);
                } else {
                    next(null, res);
                }
            });
        }
    }
}

function runGenerator(gen, cb) {
    // 先获得迭代器
    const it = gen();
    // 驱动generator运行
    next();

    function next(err, res) {
        if (err) {
            try {
                // 防止Unhandled promise rejection
                return it.throw(err);
            } catch (e) {
                return cb(err);
            }
        }

        const { value, done } = it.next(res);
        if (done) {
            return cb(null, value);
        }

        thunk = toThunk(value);
        if (typeof thunk === 'function') {
            thunk.call(this, function (err, res) {
                if (err) {
                    next(err, null);
                } else {
                    next(null, res);
                }
            });
        }
    }
}

runGenerator(main, function (err, sizeInfo) {
    if (err) {
        console.error('error', err);
    } else {
        console.dir(sizeInfo);
    }
});

function* main() {
    const sizeInfo = {
        'file1': 0,
        'file2': 0,
        'file3': 0
    };

    sizes = yield [
        size('file1.md'),
        size('file2.md'),
        size('file4.md')
    ];

    sizeInfo['file1'] = sizes[0];
    sizeInfo['file2'] = sizes[1];
    sizeInfo['file3'] = sizes[2];

    return sizeInfo;
}
