const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const con = require('./database2');
const { body, validationResult } = require('express-validator');
const { redirect } = require('express/lib/response');
const { table } = require('console');
const app = express();


app.use(express.urlencoded({ extended: false }));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 3600 * 1000
}));

app.use(express.static(path.join(__dirname, '/public')))



const ifNotLoggedin = (req, res, next) => {

    if (!req.session.isLoggedIn) {
        return res.render('login');
    }
    next();
}
const ifLoggedin = (req, res, next) => {
    if (req.session.Status == "admin") {
        return res.redirect('Tableuser')
    }
    if (req.session.isLoggedIn) {
        return res.redirect('/home');
    }
    next();
}


app.post('/deleteprofile', [body('name_user', '').trim().not().isEmpty(),], (req, res) => {
    const { name_user } = req.body
    dbConnection.execute("DELETE FROM `users` WHERE `name`=?", [name_user])
    res.redirect('Tableuser')

})





app.post('/edituser', [body('user_email', 'Invalid email address!').trim().not().isEmpty(),
body('user_name', 'Username is Empty!').trim().not().isEmpty(),
body('user_phone', 'Username is Empty!').trim().not().isEmpty(),
body('user_status', 'Username is Empty!').trim().not().isEmpty(),
body('user_id', 'Username is Empty!').trim().not().isEmpty(),
body('user_pass', 'The password must be of minimum length 6 characters').trim().isLength({ min: 6 })], (req, res) => {


    const { user_name, user_pass, user_email, user_phone, user_status, user_id } = req.body;



    bcrypt.hash(user_pass, 12).then((hash_pass) => {

        if (req.session.Status == "admin") {

            async function call1() {
                await dbConnection.execute("UPDATE `users` SET `name`= ?,`email`=?,`phone`=? WHERE id=?", [user_name, user_email, user_phone, req.session.userID])
                    .then(result => {

                    }).catch(err => {
                        if (err) throw err;
                    });
            }

            async function call2() {
                await dbConnection.execute("UPDATE `users` SET `name`= ?,`email`=?,`phone`=?,`status`=? WHERE id=?", [user_name, user_email, user_phone, user_status, user_id])
                    .then(result => {

                    }).catch(err => {
                        if (err) throw err;
                    });
            }
            if (user_id) {
                call2()
            } else {
                call1()
            }
            return res.redirect('Tableuser');

        } else {
            dbConnection.execute("UPDATE `users` SET `name`= ?,`email`=?,`phone`=?,`password`=? WHERE id=?", [user_name, user_email, user_phone, hash_pass, req.session.userID])
                .then(result => {
                    req.session.passworD = user_pass
                    console.log(user_pass)
                    res.redirect('profile');
                }).catch(err => {
                    if (err) throw err;
                });
        }












    })
})

app.post('/profile', [body('name_user', '').trim().not().isEmpty(),], (req, res) => {
    const { name_user } = req.body
    dbConnection.execute("SELECT * FROM `users` WHERE `name`=?", [name_user]).then(([rows]) => {

        if (req.session.Status == "admin") {
            res.render('profile', {
                id_user: rows[0].id,
                name_user: rows[0].name,
                email_user: rows[0].email,
                phone_user: rows[0].phone,
                status_user: rows[0].status,
                status: req.session.Status

            })



        }

    })

})

app.post('/editproducts', [
    body('product_name', '').trim().not().isEmpty(),
    body('product_detail', '').trim().not().isEmpty(),
    body('product_amount', '').trim().not().isEmpty(),
    body('product_price', '').trim().not().isEmpty(),
    body('product_type', '').trim().not().isEmpty(),
    body('product_id', '').trim().not().isEmpty(),
], (req, res) => {

    const { product_name, product_detail, product_amount, product_price, product_type, product_id } = req.body
    dbConnection.execute("UPDATE `mn_product` SET `Name`=?,`Detail`=?,`Amount`=?,`Price`=?,`Type_id`=? WHERE Id = ?", [product_name, product_detail, product_amount, product_price, product_type, product_id])
    res.redirect('Tableproduct')

})



app.post('/addproducts', [
    body('product_name', '').trim().not().isEmpty(),
    body('product_detail', '').trim().not().isEmpty(),
    body('product_amount', '').trim().not().isEmpty(),
    body('product_price', '').trim().not().isEmpty(),
    body('product_type', '').trim().not().isEmpty(),
    body('product_image', '').trim().not().isEmpty(),
], (req, res) => {

    const { product_name, product_detail, product_amount, product_price, product_type, product_id, product_image } = req.body
    async function call() {
        dbConnection.execute("INSERT INTO `mn_product`(`Name`, `Detail`, `Amount`, `Price`, `Picture`, `Type_id`) VALUES (?,?,?,?,?,?)", [product_name, product_detail, product_amount, product_price, product_image, product_type])
    }
    call()
    res.redirect('Tableproduct')

})



app.post('/editproduct', [body('idproduct').trim().not().isEmpty(),], (req, res, next) => {
    const { idproduct } = req.body
    dbConnection.execute("SELECT * FROM `mn_product` WHERE `id`=?", [idproduct]).then(([rows]) => {
        res.render('editproduct', {
            Id: rows[0].Id,
            Name: rows[0].Name,
            Detail: rows[0].Detail,
            Amount: rows[0].Amount,
            Price: rows[0].Price,
            Type_id: rows[0].Type_id,
            status: req.session.Status
        });



    })

})


app.get('/addproduct', (req, res, next) => {

    res.render('addproduct');

})





app.get('/profile', ifNotLoggedin, (req, res, next) => {

    if (req.session.Status == "admin") {
        dbConnection.execute("SELECT * FROM `users` WHERE `id`=?", [req.session.userID]).then(([rows]) => {

            res.render('profile', {
                iduser: rows[0].id,
                name: rows[0].name,
                email: rows[0].email,
                phone: rows[0].phone,
                status: req.session.Status,
                S: "myself"
            })
        })


    } else {
        dbConnection.execute("SELECT * FROM `users` WHERE `id`=?", [req.session.userID]).then(([rows]) => {
            res.render('profile', {
                iduser: rows[0].id,
                name: rows[0].name,
                email: rows[0].email,
                phone: rows[0].phone,
                password: req.session.passworD,
                status: rows[0].status
            });



        })
    }





})

// END OF CUSTOM MIDDLEWARE

app.get('/login', (req, res, next) => {
    return res.redirect('/');
})

app.get('/register', (req, res, next) => {
    if (req.session.Status == "admin") {
        return res.render('register', {
            name: req.session.user_name,
            emsil: req.session.Email,
            password: req.session.passworD,
            status: req.session.Status,
            id: req.session.userID,
        });
    }
    return res.render('register');
})

app.get("/showproductall", (req, res) => {
    con.query("SELECT * FROM mn_product", (err, result) => {
        if (err) return res.status(200).send(err);
        else return res.status(200).send(result);
    })

})
app.get("/showproduct1", (req, res) => {
    con.query("SELECT * FROM mn_product WHERE Type_id = '1'", (err, result) => {
        if (err) return res.status(200).send(err);
        else return res.status(200).send(result);
    })

})
app.get("/showproduct2", (req, res) => {
    con.query("SELECT * FROM mn_product WHERE Type_id = '2'", (err, result) => {
        if (err) return res.status(200).send(err);
        else return res.status(200).send(result);
    })

})
app.get("/showproduct3", (req, res) => {
    con.query("SELECT * FROM mn_product WHERE Type_id = '3'", (err, result) => {
        if (err) return res.status(200).send(err);
        else return res.status(200).send(result);
    })

})
app.get("/showproduct4", (req, res) => {
    con.query("SELECT * FROM mn_product WHERE Type_id = '4'", (err, result) => {
        if (err) return res.status(200).send(err);
        else return res.status(200).send(result);
    })

})

app.get("/showproduct5", (req, res) => {
    con.query("SELECT * FROM mn_product WHERE Type_id = '5'", (err, result) => {
        if (err) return res.status(200).send(err);
        else return res.status(200).send(result);
    })

})





app.get("/showproductall", (req, res) => {
    con.query("SELECT * FROM mn_product", (err, result) => {
        if (err) return res.status(200).send(err);
        else return res.status(200).send(result);
    })

})
app.get('/Cartt', ifNotLoggedin, (req, res, next) => {
    dbConnection.execute("SELECT `name` FROM `users` WHERE `id`=?", [req.session.userID])
        .then(([rows]) => {
            dbConnection.execute("SELECT mn_cart.Id,users.name,mn_product.Name, mn_cart.Amount,mn_cart.Total,mn_cart.Status,mn_cart.Id_product FROM (users INNER JOIN mn_cart ON users.id = mn_cart.Id_user) INNER JOIN mn_product ON mn_product.Id = mn_cart.Id_product WHERE users.id = ?", [req.session.userID]).then(([result]) => {
                res.render('Cartt', {
                    name: rows[0].name,
                    result: result
                });
            });
        });
})

app.post('/buyaway', [body('id_product', '').trim().not().isEmpty(),
body('id_product_id', '').trim().not().isEmpty(),
body('amount', '').trim().not().isEmpty()], async (req, res) => {
    const { id_product, id_product_id, amount } = req.body

    await dbConnection.execute("UPDATE `mn_cart` SET `Status`=? WHERE Id = ?", [1, id_product])
    await dbConnection.execute("SELECT * FROM mn_product WHERE Id = ?", [id_product_id]).then(([rows]) => {

        let amountt = rows[0].Amount
        let amounttotal = amountt - parseInt(amount)
        dbConnection.execute("UPDATE `mn_product` SET `Amount`=? WHERE Id= ?", [amounttotal, id_product_id])
    })
    res.redirect('/Cartt')
})

app.post('/delectaway', [body('id_product', '').trim().not().isEmpty()], (req, res) => {
    const { id_product } = req.body
    if (req.session.Status == "admin") {
        dbConnection.execute("DELETE FROM `mn_cart` WHERE Id=?", [id_product])
        res.redirect('/Tablecart')
    } else {
        dbConnection.execute("DELETE FROM `mn_cart` WHERE Id=?", [id_product])
        res.redirect('/Cartt')
    }


})


app.post('/delectproduct', [body('idproduct', '').trim().not().isEmpty()], (req, res) => {
    const { idproduct } = req.body
    dbConnection.execute("DELETE FROM `mn_product` WHERE Id=?", [idproduct])
    res.redirect('Tableproduct')
})

app.post('/addtocart', [body('id_product', '').trim().not().isEmpty(),
body('amount', '').trim().not().isEmpty(),
body('price_product', '').trim().not().isEmpty(),
], async (req, res) => {

    const { id_product, amount, price_product } = req.body

    await dbConnection.execute("SELECT * FROM `mn_product` WHERE `Id`=?", [id_product]).then(([rows]) => {
        req.session.total = rows[0].Price
    })
    const amounts = parseInt(amount)
    let total = 0
    if (price_product) {
        total = parseFloat(price_product)
    } else {
        total = parseFloat(req.session.total)
    }
    const totals = total * amounts


    await dbConnection.execute("INSERT INTO `mn_cart`(`Id_user`, `Id_product`, `Amount`, `Total`, `Status`) VALUES (?,?,?,?,?)", [req.session.userID, id_product, amount, totals, 0])
        .then(([rows]) => {
            res.send(`Add to product successfully <a href="Cartt">Go to Cart</a>`);
        }).catch(err => {
            if (err) throw err;
        });
})



app.post('/carts', ifNotLoggedin, [body('id', '').trim().not().isEmpty()], (req, res) => {
    const { id } = req.body
    req.session.productID = id
    console.log(req.session.productID)
    dbConnection.execute("SELECT * FROM `mn_product` WHERE `Id`=?", [req.session.productID])
        .then(([result]) => {

            res.render('cart', {
                iduser: req.session.productID,
                name: req.session.name,
                productname: result[0].Name,
                productprice: result[0].Price,
                productdetail: result[0].Detail,
                image: result[0].Picture,
            });

        });

})

app.get('/cart', ifNotLoggedin, (req, res, next) => {
    dbConnection.execute("SELECT `name` FROM `users` WHERE `id`=?", [req.session.userID])
        .then(([rows]) => {

            res.render('cart', {
                name: rows[0].name,
            });
        });
})

app.get('/login', (req, res, next) => {
    res.redirect('/')
})


app.get('/', ifNotLoggedin, (req, res, next) => {
    dbConnection.execute("SELECT `name` FROM `users` WHERE `id`=?", [req.session.userID])
        .then(([rows]) => {
            req.session.name = rows[0].name;
            res.render('home', {
                name: rows[0].name
            });
        });

});



app.post('/register',
   
    [
        body('user_email', 'Invalid email address!').isEmail().custom((value) => {
            return dbConnection.execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
                .then(([rows]) => {
                    if (rows.length > 0) {
                        return Promise.reject('This E-mail already in use!');
                    }
                    return true;
                });
        }),
        body('user_name', 'Username is Empty!').trim().not().isEmpty(),
        body('user_phone', 'Username is Empty!').trim().not().isEmpty(),
        body('user_pass', 'The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
    ],
    (req, res, next) => {

        const validation_result = validationResult(req);
        const { user_name, user_pass, user_email, user_phone } = req.body;
    
        if (validation_result.isEmpty()) {
           
            bcrypt.hash(user_pass, 12).then((hash_pass) => {
               
                dbConnection.execute("INSERT INTO `users`(`name`,`email`,`phone`,`password`) VALUES(?,?,?,?)", [user_name, user_email, user_phone, hash_pass])
                    .then(result => {
                        if (req.session.Status == "admin") {
                            res.redirect('Tableuser')
                        } else {

                            res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
                        }
                    }).catch(err => {
                       
                        if (err) throw err;
                    });
            })
                .catch(err => {
                   
                    if (err) throw err;
                })
        }
        else {
           
            let allErrors = validation_result.errors.map((error) => {
                return error.msg;
            });
           
            res.render('register', {
                register_error: allErrors,
                old_data: req.body
            });
        }
    });




app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.execute('SELECT email FROM users WHERE email=?', [value])
            .then(([rows]) => {
                if (rows.length == 1) {
                    return true;
                }
                return Promise.reject('Invalid Email Address!');
            });
    }),
    body('user_pass', 'Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const { user_pass, user_email } = req.body;

    if (validation_result.isEmpty()) {

        dbConnection.execute("SELECT * FROM `users` WHERE `email`=?", [user_email])
            .then(([rows]) => {
                bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                    if (compare_result === true) {
                        if (rows[0].status == "admin") {
                            req.session.isLoggedIn = true;
                            req.session.userID = rows[0].id;
                            req.session.Email = rows[0].email;
                            req.session.passworD = user_pass
                            req.session.Status = rows[0].status
                            req.session.user_name = rows[0].name

                            return res.render('Table', {
                                name: req.session.user_name,
                                emsil: req.session.Email,
                                password: req.session.passworD,
                                status: req.session.Status,
                                id: req.session.userID
                            })
                        }
                        req.session.isLoggedIn = true;
                        req.session.userID = rows[0].id;
                        req.session.Email = rows[0].email;
                        req.session.passworD = user_pass
                        res.redirect('/');
                    }
                    else {
                        res.render('login', {
                            login_errors: ['Invalid Password!']
                        });
                    }
                })
            })
    }
    else {
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        res.render('login', {
            login_errors: allErrors
        });
    }
});


app.get('/Table', (req, res) => {
    if (req.session.Status == "admin") {

        return res.render('Table', {
            name: req.session.user_name,
            emsil: req.session.Email,
            password: req.session.passworD,
            status: req.session.Status,
            id: req.session.userID,


        })

    }
})

app.get('/Tableuser', (req, res) => {
    if (req.session.Status == "admin") {
        dbConnection.execute("SELECT * FROM users").then(([rows]) => {
            res.render('Tableuser', {
                name: req.session.user_name,
                emsil: req.session.Email,
                password: req.session.passworD,
                status: req.session.Status,
                id: req.session.userID,
                result: rows
            });
        })

    }
})


app.get('/Tableproduct', (req, res) => {
    if (req.session.Status == "admin") {
        dbConnection.execute("SELECT * FROM mn_product").then(([rows]) => {
            res.render('Tableproduct', {
                name: req.session.user_name,
                emsil: req.session.Email,
                password: req.session.passworD,
                status: req.session.Status,
                id: req.session.userID,
                result: rows
            });
        })

    }
})


app.get('/Tablecart', (req, res) => {
    if (req.session.Status == "admin") {
        dbConnection.execute("SELECT mn_cart.Id,users.name,mn_product.Name, mn_cart.Amount,mn_cart.Total,mn_cart.Status FROM (users INNER JOIN mn_cart ON users.id = mn_cart.Id_user) INNER JOIN mn_product ON mn_product.Id = mn_cart.Id_product").then(([rows]) => {
            res.render('Tablecart', {
                name: req.session.user_name,
                emsil: req.session.Email,
                password: req.session.passworD,
                status: req.session.Status,
                id: req.session.userID,
                result: rows
            });
        })

    }
})





app.get('/logout', (req, res) => {

    req.session = null;
    res.redirect('/');
});


app.use('/', (req, res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});


app.listen(3000, () => console.log("Server is Running..."));
