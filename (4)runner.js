const fs = require('fs');

function size(filename) {
    // 让`size`不耦合`next()`
    return function(fn) {
        fs.stat(filename, function(err, stat) {
            if(err) fn(err);
            else
                fn(null, stat.size);
        });
    }
}

function runGenerator(gen) {
    // 先获得迭代器
    const it = gen();
    // 驱动generator运行
    next();

    function next(err, res) {
        if(err) {
            return it.throw(err);
        }

        const { value, done } = it.next(res);
        if(done) {
            return;
        }

        if(typeof value === 'function') {
            value.call(this, function(err, res) {
                if(err) {
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
        sizeInfo['file1'] = yield size('file1.md');
        sizeInfo['file2'] = yield size('file2.md');
        sizeInfo['file3'] = yield size('file3.md');
    } catch(error) {
        console.error('error:', error);
    }
    console.dir(sizeInfo)
}

runGenerator(main);

