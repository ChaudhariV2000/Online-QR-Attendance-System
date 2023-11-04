const express = require("express");
const app = express();
const port = 7777 ;

require("./config/dbconnection");

const teacher = require("./middleware/teacher_operation")
const path = require("path");
const student = require("./middleware/student_operation")
app.use(express.urlencoded({extended: true}));
const helper = require("./middleware/Helper")
const session = require("express-session");
const bodyparser = require("body-parser");
const { body} = require('express-validator');
const{validationResult } = require("express-validator")



const cookie = require("cookie-parser");
// const helper = require("./middleware/Helper")

//using cookies
// app.use(cookie);

//setting view engine EJS
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"))
app.engine('html', require('ejs').renderFile);

// for body parsing
app.use(express.urlencoded({extended: false}));
// const url
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 3600000 // session expires after 1 hour
    }
  }));
app.use(cookie())

app.listen(port,()=>{
    console.log(`App successfully listening on ${port}`)
})


app.get("/",(req,resp)=>{
    resp.render("welcome")
})

app.get("/login_pg",(req,resp)=>{
    resp.render("login")
})

app.get("/login",[helper.redirect_user],(req,resp)=>{
    resp.render("login");
})


app.post("/login_teacher",teacher.login_teacher_verify,(req,resp,next)=>{
    resp.redirect("teacher_menu.html")
})


app.post("/student_login",[student.student_login_verify],(req,resp)=>{
    // resp.send("Student Logged In Successfully")
    // resp.send("cookie");
})

app.get("/register_teacher",(req,resp,next)=>{
    resp.render("register_teacher")
})


app.get("/student_register", async(req,resp,err)=>{
    resp.render("register_student");
    if(err){
        resp.status(err);
    }
})

app.get("/otp_verification",(req,resp,err)=>{
    try{
        if(err)
        {
            resp.send(err)
        }
        else{ resp.render('otp')}
    }
    catch(e)
    {
        console.log(e)
    }

})

// for teacher otp verification
app.post("/verify_otp",(req,resp,next)=>{
    helper.verify_Otp(req,resp,next);
})


app.post("/register_teacher",
[

    // validate.check('stud_name',"The username should be length 5").exists().length({min:3}),

    body('teacher_name').notEmpty().withMessage('Username cannot be empty'),
    body('teacher_name').isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),
    body('teacher_no').isLength({ max: 10 }).withMessage('ph no. 10 digit')

],[teacher.register_teacher],(req,resp,next,err)=>{
    const error = validationResult(req);
    if(!error.isEmpty())
    {
        return resp.render("register_student",{msg:"Please enter valid Details"})
    }
    else{
        teacher.register_teacher
    }
    })


// for student otp verification
app.post("/verify_otp_stud",(req,resp,next)=>{
    helper.verify_Otp_stud(req,resp,next);
})

app.post("/student_register",[

    // validate.check('stud_name',"The username should be length 5").exists().length({min:3}),

    body('stud_name').notEmpty().withMessage('Username cannot be empty'),
    body('stud_name').isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),
    body('stud_phone').isLength({ max: 10 }).withMessage('ph no. 10 digit')

],[student.student_register],async(req,resp)=>{
    const error = validationResult(req);
    if(!error.isEmpty())
    {
        return resp.render("register_student",{msg:"Please enter valid Details"})
    }
})


// TEACHER MENU ROUTES

app.get("/teacher_menu",[helper.authorize_user],(req,resp,next)=>{
    resp.render("teacher_menu")
})

// app.get("/teacher_menu",(req,resp)=>{
//     resp.render("teacher_menu.html")
// })


app.get("/create_qr",[helper.authorize_user],(req,resp,next)=>{
    resp.render("teacher_menu");
})

app.post("/create_qr",[teacher.create_qr],(req,resp)=>{
    
})

app.get("/create_classroom",[helper.authorize_user],(req,resp)=>{
    resp.render("create_classroom");
})

app.post("/create_classroom",[teacher.create_classroom],(req,resp,next)=>{
    // resp.send("Classroom created successfully")
})


app.get("/classroom_attendance",[teacher.get_sheet],(req,resp)=>{
    // resp.render("classroom_menu.html")
})


app.get("/teacher_student_details",[helper.authorize_user],(req,resp)=>{
    resp.render("teacher_student_details")

})


app.post("/teacher_student_details",[teacher.InfoDetails],(req,resp)=>{

})

app.post("/all_student_attendance",[teacher.allDetails],(req,resp)=>{

})



app.get("/logout_teacher",(req,resp)=>{
    resp.clearCookie('Teach_data')
    resp.clearCookie('Teach_authToken')
    // resp.send("Logout successfull");
    resp.render("login",{logout_teacher:"Logout successfull"});

})




// app.get("/",(req,resp)=>{
//     resp.send("hello");
// })

// app.get("/student_register",[student.student_create],(req,resp)=>{
//     resp.send("Student Registered Successfully")
// })


//STUDENT MENU ROUTES--------------------------------------------------------------------------------

app.get("/scanner",[helper.authorize_stud],(req,resp)=>{
    resp.render("scanner_QR");
})

app.post("/scanner",[teacher.verifyStud],(req,resp)=>{

})

app.post("/scan_qr",[teacher.verifyStud],(req,resp)=>{
    
})

app.get("/student_menu",[helper.authorize_stud],(req,resp)=>{
    resp.render("student_menu")
})

//for particular student attendance
app.post("/student_menu",[student.attendSheet],(req,resp)=>{

})

app.get("/logout_student",(req,resp)=>{
    resp.clearCookie('stud_data');
    resp.clearCookie('stud_authToken');
    resp.render("login",{logout_student:"Logout Successfully"});
})


app.get("/demo",[helper.checking],(req,resp)=>{

})
// ATUTHENTICATION ROUTES ------------------------------------------------------------------

// app.get("/get_auth",[helper.authorize_user],(req,resp)=>{

// })

















// app.get("/login_teacher",[teacher.login_teacher_verify],(req,resp,next)=>{
//     resp.send("Login successfull");
// })








module.exports = {app}