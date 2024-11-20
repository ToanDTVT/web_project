const mysql = require('mysql');

const ketnoi = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'usermanagement'
});

ketnoi.connect(function(err) {
    if(err) {
        console.log('Kết nối CSDL không thành công, kiểm tra lại CSDL')
    }
});

module.exports = ketnoi;