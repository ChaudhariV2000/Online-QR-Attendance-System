const student = require("../model/student_schema")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
// const student_model = require("../model/student_schema")
const helper = require("../middleware/Helper")
const student_schema = require("../model/student_schema");
const mongoose = require("mongoose");
const teacher = require("../model/teacher_schema")
const os = require("os");



async function student_register(req,resp,next)
{
    try{
        // const macAddress = Object.values(os.networkInterfaces())
        // .flat()
        // .filter(iface => !iface.internal && iface.mac !== '00:00:00:00:00:00')
        // .map(iface => iface.mac)
        // .shift();
 
    const student_reg_data = new student.student_register_model({
        roll_no:req.body.stud_roll.trim(),
        Name:req.body.stud_name.trim(),
        password:req.body.stud_pass.trim(),
        year:req.body.stud_year.trim(),
        role:"student".trim(),
        discipline:req.body.stud_dept.trim(),
        semester:req.body.stud_sem.trim(),
        phone_number:req.body.stud_phone.trim(),
        mac_address:macAddress.trim()
    })
    console.log(req.body.stud_phone)
    const status = await student_reg_data.save();
    console.log(status)
}catch(e)
{
    // console.log(e)
    return resp.render("register_student",{error:"Roll No. OR Phone number OR Password is already present"})
}

try{
    const attenstud = new student.student_attendance_model({
        roll_no:req.body.stud_roll.trim(),
        year:req.body.stud_year.trim(),
        discipline:req.body.stud_dept.trim(),
        semester:req.body.stud_sem.trim()
})

const attenesult = await attenstud.save()
console.log("Student Attendance :",attenesult);
    // helper.generateOtp_Stud(req,resp,student_reg_data);

    // const student_attendance_model = new mongoose.model("TYCO1",student_schema)
    // console.log(req.body.stud_roll);

    resp.render("login",{msg:"Registered Successfully, Please Login to Verify"})
    console.log("Student Registered Successfully");
    }
    catch(e)
    {
        // resp.render("register_student",{error:"Roll No. OR Phone number OR Password is already present"})
        console.log(e)
    }
}

async function student_login_verify(req,resp,next)
{
    try{
        
        const macAddress = Object.values(os.networkInterfaces())
        .flat()
        .filter(iface => !iface.internal && iface.mac !== '00:00:00:00:00:00')
        .map(iface => iface.mac)
        .shift();

        // const macAddress = "alsdjfalsd:alsdjf"; // for verifying purpose given invalid macAddress

        const roll = req.body.student_roll;
        const password = req.body.student_password;
        

        const verify_roll = await student.student_register_model.find({roll_no:roll});
        // console.log(verify_roll);

        if(verify_roll.length == 0)
        {
            return resp.render("login",{msg:"ID not found"})
        }

        const verify_password = await student.student_register_model.find({roll_no:roll}).select({password:1,year:1,discipline:1,mac_address:1,token:1}) 
        console.log(verify_password[0].token, req.body.stud_authToken);

        console.log(macAddress);
    //     if(macAddress == verify_password[0].mac_address)
    //    { 
    //     && req.cookies.stud_authToken == verify_password[0].token

        if(password == verify_password[0].password )
        {
            const year = verify_password[0].year;
            const discipline = verify_password[0].discipline;
            const data = req.body.student_roll + " " +year + " " + discipline
            console.log("Data from cookie : ",data);

            const token = await helper.generateAuthToken(req,resp,next);

            console.log("Return token : "+token );
            helper.createCookie_stud(req,resp,next,data,token); // setting cookie in user side

            resp.redirect("./student_menu")
        }
        else{
            return resp.render("login",{error : "Invalid Credentials"})
        }
    // }
    // else{ resp.render("login",{not_device:" This device is not authorized for given roll_no"})}

    }catch(e)
    {
        console.log(e);
    }
}

async function attendSheet(req,resp)
{
    try{
    const data = req.cookies.stud_data;
    const stud_data = data.split(" ");
    const year = req.body.select1
    const semester = req.body.select2
    const discipline = req.body.discipline
    const subject = req.body.subject

    const getStudent = await student.student_attendance_model.find({roll_no:stud_data[0]}).select({[subject]:1}).sort({roll_no:1})
    console.log(getStudent[0][subject]); //printing student subject dates

    const student_date = getStudent[0][subject]

    const getTeacherData = await teacher.teacher_classroom_model.find({$and:[{year:year},{semester:semester},{discipline:discipline},{subject:subject}]})
    // console.log(getTeacherData[0].create_qr_dates); //printing teacher subject dates
    const teacher_date = getTeacherData[0].create_qr_dates

    resp.render("student_attendance_sheet",{student_date:student_date,teacher_date:teacher_date});
    }
    catch(e)
    {
        console.log(e);
        resp.render("student_menu",{error:"Data not found or Something went wrong"})
    }
}


module.exports={student_login_verify,student_register,attendSheet}






