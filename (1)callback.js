const fs = require('fs');

function error(err) {
    throw new Error(err);
}
function main() {
    const sizeInfo = {
        'file1': 0,
        'file2': 0,
        'file3': 0
    };
    fs.stat('file1.md', function(err, stat) {
        if(err) return error(err);
        sizeInfo['file1'] = stat.size;
        fs.stat('file2.md', function(err, stat) {
            if(err) return error(err);
            sizeInfo['file2'] = stat.size;
            fs.stat('file3.md', function(err, stat){
                if(err) return error(error);
                sizeInfo['file3'] = stat.size;
                console.dir(sizeInfo);
            });
        })
    });
}

main();
