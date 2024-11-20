class Information
{
    constructor() {

    }
    getAll(callback) {
        let sql = "SELECT * FROM users";
        ketnoi.query(sql, function(err, data) {
            callback(err, data);
        });
    }
}

module.exports = Information;