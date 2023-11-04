const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const student_model = require("../model/student_schema")
const teacher = require("../model/teacher_schema")
const student = require("../model/student_schema")
// const app = require("../index");
const express = require("express");
const app = express();
const cookie = require("cookie-parser")
const path = require("path");
const sid = 'ACd7d90a0cd830d8db32ea03d9d28cd201'
const auth_token = 'a5c85e83851fe31e6150e8987dd0905c'
const os = require("os");
// 
var twilio = require('twilio')(sid, auth_token)
app.use(cookie())


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.engine('html', require('ejs').renderFile);



async function generateAuthToken(req, resp, next) {
    try {

        if (req.body.teacher_name != null) {
            const payload_teacher = { data: req.body.teacher_name }
            console.log("Teacher id : " + req.body.teacher_name)
            const token = jwt.sign(payload_teacher, "asldfjsadljfdsljfldsjlfdsjfdsldslakjfdslasdf8234823$#23", {
                expiresIn: "60"
            });
            const setToken = await teacher.teacher_register_model.updateOne({ uniqueid: req.body.teacher_name }, {
                $set: { token: token }
            })

            console.log("Token : " + token);
            return token

        }

        //For student
        if (req.body.teacher_name == null) {
            const payload_student = { name: req.body.stud_roll };
            console.log("Student roll_no : " + req.body.student_roll);
            const token = jwt.sign(payload_student, "eoiwre0283409dklsjLJDS;LFJASLJFWI3O2");

            //secret key for creating jwt token eoiwre0283409dklsjLJDS;LFJASLJFWI3O2

            const setToken = await student.student_register_model.updateOne({ roll_no: req.body.student_roll }, {
                $set: { token: token }
            })
            console.log("Setting Token :", setToken);
            console.log("Token : " + token);
            return token
        }
    } catch (e) {
        console.log(e);
    }
}

async function createCookie(req, resp, next, data, token) {
    resp.cookie("Teach_data", data, { expires: new Date(Date.now() + 1000 * 60 * 60 * 24) });

    resp.cookie("Teach_authToken", token);

    const cookie = req.cookies.data;
    console.log("Cookie Stored : " + cookie);
    if (cookie)
        console.log("Cookie set : ", true)
    else {
        console.log("Cookie set : ", false)
    }
}

async function createCookie_stud(req, resp, next, data, token) {
    resp.cookie("stud_data", data, { expires: new Date(Date.now() + 1000 * 60 * 60 * 24) });
    resp.cookie("stud_authToken", token);
    const cookie = req.cookies.data;
    // const sep = cookie.split(" ");
    // console.log("Cookie : "+sep[1]);
    console.log("Cookie Stored : " + cookie);
    if (cookie)
        console.log("Cookie set : ", true)
    else
        console.log("Cookie set : ", false)

}

async function redirect_user(req, resp, next) {
    try {
        if (req.cookies.stud_data && req.cookies.stud_authToken) {
            const Student_data = req.cookies.stud_data;
            const data = Student_data.split(" ");
            const stud_db_token = await student.student_register_model.find({ roll_no: data[0] }).select({ token: 1 });
            // console.log(stud_db_token) printing token from db

            if (req.cookies.stud_authToken == stud_db_token[0].token) {
                resp.redirect("./Student_menu");
                console.log("Student Redirected Successfully")
                return "Student Redirected Successfully";
            }
            // else{   next()  }
        }


        if (req.cookies.Teach_data && req.cookies.Teach_authToken) {

            const Teacher_data = req.cookies.Teach_data;
            const getTeacher = await teacher.teacher_register_model.find({ uniqueid: Teacher_data }).select({ token: 1 })
            console.log(getTeacher);

            if (req.cookies.Teach_authToken == getTeacher[0].token) {
                resp.redirect("/teacher_menu")
                console.log("Teacher Redirected Successfully")
                return "Teacher Redirected Successfully"
            }
            else { next() }

        } else { next() }
    }
    catch (error) {
        console.log("Error", error)
    }
}


async function authorize_user(req, resp, next) {
    try {

        // if(req.cookies.stud_data)
        // {
        //     const stud_data = (req.cookies.stud_data).split(" ")
        //     const roll_no = stud_data[0];

        //     const student_data = await student.student_register_model.find({roll_no:roll_no}).select({role:1})
        //     console.log(student_data);

        //     if(student_data[0].role == "student")
        //     {
        //         return resp.render("login",{unauthorize:"You are not authorized"});
        //     }
        // }

        if (req.cookies.Teach_data) {
            const teacher_data = await teacher.teacher_register_model.find({ uniqueid: req.cookies.Teach_data }).select({ role: 1, token: 1 })
            console.log(teacher_data[0].role);

            if (teacher_data[0].role != "teacher" && req.cookies.Teach_authToken != teacher_data[0].token) {
                return resp.render("login", { unauthorize: "You are not authorized" });
            }
            next()

        }
        else {
            return resp.render("login", { unauthorize: "You are not authorized" });
        }
        next()

    }
    catch (e) {
        resp.render("login", { error: "Something went wrong Please login" })
        console.log(e)
    }
}


async function authorize_stud(req, resp, next) {
    try {
        if (req.cookies.stud_data) {
            const stud_data = (req.cookies.stud_data).split(" ")
            const roll_no = stud_data[0];

            const student_data = await student.student_register_model.find({ roll_no: roll_no }).select({ role: 1, token: 1 })
            console.log(student_data);

            if (student_data[0].role != "student") {
                return resp.render("login", { unauthorize: "You are not authorized" });
            }
            next()
        }
        else {
            return resp.render("login", { unauthorize: "You are not authorized" });
        }
        next()

    }
    catch (e) {
        resp.render("login", { error: "Something went wrong Please login" })
    }
}


function generateRandomNumber() {
    var minm = 100000;
    var maxm = 999999;
    return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
}


async function generateOtp(req, resp, next, teacher_reg_data) {
    try {
        const otp = generateRandomNumber()
        const otp_no = new teacher.otp_model({
            Phone_Number: req.body.teacher_no,
            otp: otp
        })
        const number = req.body.teacher_no;
        const status = await otp_no.save();
        console.log(status);

        // twilio.messages.
        // create({
        //     from:"+15074315461",
        //     to:"+91"+req.body.teacher_no,
        //     body:"Your OTP for Attendance System is : "+otp
        // }).then((resp)=>console.log('message has sent!',resp))
        // .catch((e)=>{console.log("Error :",e)})

        resp.render("otp", { no: number, teacher_data: teacher_reg_data });
    }
    catch (e) {
        console.log(e);
    }
}

async function verify_Otp(req, resp, next) {
    const teacher_data = req.body.teacher_data;
    // console.log(teacher_data); //checking data from ejs
    const Phone_Number = req.body.ph_no;
    const otp = req.body.no1 + req.body.no2 + req.body.no3 + req.body.no4 + req.body.no5 + req.body.no6

    const status = await teacher.otp_model.find({ Phone_Number: Phone_Number, otp: otp });

    if (status == undefined) {
        return resp.render("register_teacher", { otpmsg: "Invalid OTP, Please fill all the details again" })
    }
    // console.log(status);

    console.log(typeof (teacher_data));
    data = teacher_data.split(":")
    data = data.toString();
    data = data.split(",")
    data = data.toString();
    data = data.split("'");

    try {
        const teacher_details = new teacher.teacher_register_model({
            uniqueid: data[1],
            name: data[3],
            password: data[5],
            role: "teacher",
            mobileno: data[9]
        })
        const result = await teacher_details.save()
        console.log(result);
        resp.render("login", { s: "Registered Successfully, Please Login to Verify" })
    }
    catch (e) {
        console.log(e)
        resp.render("register_teacher", { e: "unique id or password already present" })
    }
}

async function generateOtp_Stud(req, resp, student_reg_data) {
    try {
        const otp = generateRandomNumber()
        const otp_no = new teacher.otp_model({
            Phone_Number: req.body.stud_phone,
            otp: otp
        })
        const number = req.body.stud_phone;
        const status = await otp_no.save();
        console.log(status);

        // twilio.messages.
        // create({
        //     from:"+15074315461",
        //     to:"+91"+req.body.teacher_no,
        //     body:"Your OTP for Attendance System is : "+otp
        // }).then((resp)=>console.log('message has sent!',resp))
        // .catch((e)=>{console.log("Error :",e)})

        resp.render("otp_stud", { no: number, teacher_data: student_reg_data });
    }
    catch (e) {
        console.log(e);
    }
}


async function verify_Otp_stud(req, resp, next) {
    const student_data = req.body.teacher_data;
    // console.log(teacher_data); //checking data from ejs
    const Phone_Number = req.body.ph_no;
    const otp = req.body.no1 + req.body.no2 + req.body.no3 + req.body.no4 + req.body.no5 + req.body.no6

    const status = await teacher.otp_model.find({ Phone_Number: Phone_Number, otp: otp });

    if (status == undefined) {
        return resp.render("register_student", { otpmsg: "Invalid OTP, Please fill all the details again" })
    }
    // console.log(status);

    console.log(typeof (student_data));
    // console.log(data);
    data = student_data.split(":")
    data = data.toString();
    data = data.split(",")
    data = data.toString();
    data = data.split("'");

    //phone comes in string on 14 index so splitting it again!!
    //   console.log(data[14]);
    phone = data[14].toString();
    phone = phone.split(",");
    console.log(phone[2]);

    const macAddress = Object.values(os.networkInterfaces())
        .flat()
        .filter(iface => !iface.internal && iface.mac !== '00:00:00:00:00:00')
        .map(iface => iface.mac)
        .shift();

    // for (let i = 0 ; i<data.length ; i++)
    // {console.log(data[i]+"\n")}

    try {
        const student_reg_data = new student.student_register_model({
            roll_no: data[1],
            Name: data[3],
            password: data[5],
            year: data[7],
            role: "student",
            discipline: data[11],
            semester: data[13],
            // token:"lsjdfl",
            phone_number: phone[2],
            mac_address: macAddress
        })

        const attenstud = new student.student_attendance_model({
            roll_no: data[1],
            year: data[7],
            discipline: data[11],
            semester: data[13]
        })

        const attenesult = await attenstud.save()
        console.log("Student Attendance :", attenesult);


        const result = await student_reg_data.save()
        console.log("Student Register :", result);
        resp.render("login", { msg: "Registered Successfully, Please Login to Verify" })
    }
    catch (e) {
        console.log(e)
        resp.render("register_student", { unique_error: "Roll no. or Phone Number is already present" })
    }
}


async function verifyStud(req, resp) {
    // const teacher = req.body.qrdata; console.log(teacher);
    // qr_teach_data = teacher.split(" "); console.log(typeof(qr_teach_data[1]));
    // const qr_teach_subject = qr_teach_data[4];
    // const qr_teach_year = qr_teach_data[1];
    // const qr_teach_discipline = qr_teach_data[2];
    // const qr_teach_sem = qr_teach_data[3];

    const teach_data = await teacher.teacher_classroom_model.find({ $and: [{ year: "TY" }, { discipline: "CO1" }, { subject: "PWP" }] });
    console.log(teach_data)
}

async function checking(req, resp, next) {
    const data = req.cookies.Teach_data;
    console.log(data);
    date = new Date()
    today = date.toLocaleDateString();
    const count = await teacher.teacher_classroom_model.find({ year: "TY", discipline: "CO1" }).select({ create_qr_dates: 1 })
    console.log(count[0].create_qr_dates);
    const dates = count[0].create_qr_dates;
}

module.exports = {
    generateAuthToken, createCookie, createCookie_stud, redirect_user,
    authorize_user, generateOtp, verify_Otp, generateOtp_Stud, verify_Otp_stud, authorize_stud, verifyStud, checking
};