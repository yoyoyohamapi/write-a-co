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

function isPromise(fn) {
    return fn && typeof fn.then === 'function';
}

function runGenerator(gen) {
    // 先获得迭代器
    const it = gen();
    // 驱动generator运行
    next();

    function next(err, res) {
        if (err) {
            return it.throw(err);
        }

        const { value, done } = it.next(res);
        if (done) {
            return;
        }
        if (isPromise(value)) {
            value.then(function(res) {
                next(null, res);
            }, function(err) {
                next(err);
            });
        }
        if (Array.isArray(value)) {
            // 存放异步任务结果
            const results = [];
            // 等待完成的任务数
            let pending = value.length;
            value.forEach(function (func, index) {
                func.call(this, function (err, res) {
                    if (err) {
                        next(err);
                    } else {
                        // 保证结果的存放顺序
                        results[index] = res;
                        // 直到所有任务执行完毕
                        if (--pending === 0) {
                            next(null, results);
                        }
                    }
                })
            })
        }
        if (typeof value === 'function') {
            value.call(this, function (err, res) {
                if (err) {
                    next(err, null);
                } else {
                    next(null, res);
                }
            });
        }
    }
}

function *main() {
    const sizeInfo = {
        'file1': 0,
        'file2': 0,
        'file3': 0
    };
    try{
        sizes = yield Promise.all([
            size('file1.md'),
            size('file2.md'),
            size('file3.md')
        ]);

        sizeInfo['file1'] = sizes[0];
        sizeInfo['file2'] = sizes[1];
        sizeInfo['file3'] = sizes[2];
    } catch(error) {
        console.error('error:', error);
    }
    console.dir(sizeInfo);
}

runGenerator(main);
