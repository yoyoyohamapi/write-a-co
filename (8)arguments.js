const fs = require('fs');

function size(filename) {
    return new Promise((resolve, reject)=>{
        fs.stat(filename, (err, stat) => {
            if(err)
                reject(err);
            else
                resolve(stat.size);
        });
    });
}

function toThunk(fn) {
    if(Array.isArray(fn)) {
        const results = [];
        // 等待完成的任务
        let pending = fn.length;
        return function(cb) {
            let finished = false;
            fn.forEach(function(func, index) {
                if(finished) {
                    return;
                }
                func = toThunk(func);
                func.call(this, function(err, res) {
                    if(err) {
                        finished = true;
                        cb(err);
                    } else {
                        results[index] = res;
                        // 如果再无任务，才返回`results`
                        if(--pending === 0) {
                            cb(null, results);
                        }
                    }
                } );
            })
        }
    }else if(isPromise(fn)) {
        return function(cb) {
            return fn.then(function(res){
                cb(null, res);
            }, function(err){
                cb(err);
            })
        }
    }
}

function isPromise(fn) {
    return fn && typeof fn.then === 'function';
}

function wrap(gen) {
    return function (cb) {
        const args = Array.prototype.slice.call(arguments);
        const length = args.length;
        if(length && 'function' === typeof args[length-1]) {
            cb = args.pop();
            it = gen.apply(this, args);
        } else {
            return;
        }
        // 驱动generator运行
        next();

        function next(err, res) {
            if(err) {
                return it.throw(err);
            }

            const { value, done } = it.next(res);
            if(done) {
                cb(null, value);
            }
            thunk = toThunk(value);
            if(typeof thunk === 'function') {
                thunk.call(this, function(err, res) {
                    if(err) {
                        next(err, null);
                    } else {
                        next(null, res);
                    }
                });
            }
        }
    }
}

function *main(files) {
    // 初始化信息
    const sizeInfo = files.reduce((info, file) => {
        info[file] = 0;
        return info;
    }, {});

    try{
        const requests = files.map((file) => {
            return size(file);
        });

        sizes = yield requests;

        sizes.forEach((size, index) => {
            sizeInfo[files[index]] = sizes[index];
        });

        return sizeInfo;
    } catch(error) {
        console.error('error:', error);
    }
}

wrap(main)(['file1.md', 'file2.md', 'file3.md'], (err, value)=>{
     console.log('value', value);
});
