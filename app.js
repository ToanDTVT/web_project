const express = require('express');

const app = express();


const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended:false
}));

app.set('view engine', 'ejs');
const PORT = process.env.PORT || 3000;



app.use(express.static('public'));

require('./routes/home.router')(app);
require('./routes/information.router')(app);


app.get('/register_password', function(req, res) {
    res.render('sign-in-password');
});

app.get('/users_config', async function(req, res) {
    let _name = req.query.name;
    //lấy trang hiện tại: 1, 2, 3
    let _page = req.query.page ? req.query.page : 1;
    // truy vấn tính tổng số dòng trong một bảng
    let _sql_total = "SELECT COUNT(*) as total FROM users";
    
    if (_name){
        _sql_total += " WHERE name LIKE '%" + _name + "%'";
    }

    let rowData = await query(_sql_total);
    let totalRow = rowData[0].total;
    
    let _limit = 5;
    let totalPage = Math.ceil(totalRow/_limit);
    _page = _page > 0 ? Math.floor(_page) : 1;
    _page = _page <= totalPage ? Math.floor(_page) : totalPage;

    let _start = (_page - 1) * _limit;
    let sql = "SELECT * FROM users";

    if(_name) {
        sql += " WHERE name LIKE '%" + _name + "%'";
    }
    sql += " order by id DESC LIMIT " + _start + "," + _limit;
    //số trang thực tế sẽ có
    ketnoi.query(sql, function(err, data) {
        res.render('users-config', {
            title: 'Cấu hình người dùng',
            data: data,
            totalPage: totalPage,
            _page: parseInt(_page),
            _name: _name
        });
    });
    
});


app.listen(PORT, function() {
    console.log('Serve run on http://localhost:'+ PORT)
})