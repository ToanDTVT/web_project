const informationCtrl = require('../controllers/information.controller')

module.exports = function(app) {
    app.get('/infor_users', informationCtrl.index);

    app.get('/sign_in', informationCtrl.create);
    app.post('/sign_in', informationCtrl.store);

    app.get('/edit_infor_users/:id', informationCtrl.edit)
    app.post('/edit_infor_users/:id', informationCtrl.update);

    app.get('/delete_infor_users/:id', informationCtrl.delete);
}