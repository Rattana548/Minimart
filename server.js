const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const con = require('./database2');
const { body, validationResult } = require('express-validator');
const app = express();


app.use(express.urlencoded({ extended: false }));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 3600 * 1000 // 1hr
}));

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.render('login');
    }
    next();
}
const ifLoggedin = (req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/home');
    }
    next();
}




// END OF CUSTOM MIDDLEWARE

app.get('/login', (req, res, next) => {
    return res.render('login');
})

app.get('/register', (req, res, next) => {
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
            dbConnection.execute("SELECT mn_cart.Id,users.name,mn_product.Name, mn_cart.Amount,mn_cart.Total,mn_cart.Status FROM (users INNER JOIN mn_cart ON users.id = mn_cart.Id_user) INNER JOIN mn_product ON mn_product.Id = mn_cart.Id_product WHERE users.id = ?", [req.session.userID]).then(([result]) => {
                res.render('Cartt', {
                    name: rows[0].name,
                    result: result
                });
            });
        });
})

app.post('/buyaway',[body('id_product', '').trim().not().isEmpty()],(req,res)=>{
    const { id_product} = req.body
    dbConnection.execute("UPDATE `mn_cart` SET `Status`=? WHERE Id = ?", [1,id_product])
    res.redirect('/Cartt')
})

app.post('/delectaway',[body('id_product', '').trim().not().isEmpty()],(req,res)=>{
    const { id_product} = req.body
    dbConnection.execute("DELETE FROM `mn_cart` WHERE Id=?", [id_product])
    res.redirect('/Cartt')
})



app.post('/addtocart', [body('id_product', '').trim().not().isEmpty(),
body('amount', '').trim().not().isEmpty(),
], async (req, res) => {

    const { id_product, amount } = req.body
    console.log(id_product + " + " + req.session.userID + " + " + amount)
    await dbConnection.execute("SELECT * FROM `mn_product` WHERE `Id`=?", [id_product]).then(([rows]) => {
        req.session.total = rows[0].Price
    })
    const amounts = parseInt(amount)
    const total = parseInt(req.session.total)
    const totals = total * amounts
    await dbConnection.execute("INSERT INTO `mn_cart`(`Id_user`, `Id_product`, `Amount`, `Total`, `Status`) VALUES (?,?,?,?,?)", [req.session.userID, id_product, amount, totals, 0])
        .then(([rows]) => {
            res.send(`Add to product successfully <a href="Cartt">Go to Cart</a>`);
        }).catch(err => {
            // THROW INSERTING USER ERROR'S
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

// ROOT PAGE
app.get('/', ifNotLoggedin, (req, res, next) => {
    dbConnection.execute("SELECT `name` FROM `users` WHERE `id`=?", [req.session.userID])
        .then(([rows]) => {
            req.session.name = rows[0].name;
            res.render('home', {
                name: rows[0].name
            });
        });

});// END OF ROOT PAGE


// REGISTER PAGE
app.post('/register', ifLoggedin,
    // post data validation(using express-validator)
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
    ],// end of post data validation
    (req, res, next) => {

        const validation_result = validationResult(req);
        const { user_name, user_pass, user_email, user_phone } = req.body;
        // IF validation_result HAS NO ERROR
        if (validation_result.isEmpty()) {
            // password encryption (using bcryptjs)
            bcrypt.hash(user_pass, 12).then((hash_pass) => {
                // INSERTING USER INTO DATABASE
                dbConnection.execute("INSERT INTO `users`(`name`,`email`,`phone`,`password`) VALUES(?,?,?,?)", [user_name, user_email, user_phone, hash_pass])
                    .then(result => {
                        res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
                    }).catch(err => {
                        // THROW INSERTING USER ERROR'S
                        if (err) throw err;
                    });
            })
                .catch(err => {
                    // THROW HASING ERROR'S
                    if (err) throw err;
                })
        }
        else {
            // COLLECT ALL THE VALIDATION ERRORS
            let allErrors = validation_result.errors.map((error) => {
                return error.msg;
            });
            // REDERING login-register PAGE WITH VALIDATION ERRORS
            res.render('register', {
                register_error: allErrors,
                old_data: req.body
            });
        }
    });// END OF REGISTER PAGE




// LOGIN PAGE
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
                        req.session.isLoggedIn = true;
                        req.session.userID = rows[0].id;
                        res.redirect('/');
                    }
                    else {
                        res.render('login', {
                            login_errors: ['Invalid Password!']
                        });
                    }
                })
                    .catch(err => {
                        if (err) throw err;
                    });


            }).catch(err => {
                if (err) throw err;
            });
    }
    else {
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login', {
            login_errors: allErrors
        });
    }
});




// END OF LOGIN PAGE

// LOGOUT
app.get('/logout', (req, res) => {
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

app.use('/', (req, res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});


app.listen(3000, () => console.log("Server is Running..."));