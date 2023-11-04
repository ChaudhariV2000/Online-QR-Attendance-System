const bcrypt = require("bcrypt");
const teacher = require("../model/teacher_schema.js"); // for accessing teacher's operation from DB
const helper = require("../middleware/Helper");
const random = require('randomstring');
const express = require('express')
const cookie = require("cookie-parser")
const Qrcode = require('qrcode');
const { generate } = require("randomstring");
const app = express();
app.use(cookie());
const flash = require("express-flash");
const { student_attendance_model, student_register_model } = require("../model/student_schema.js");
const { check } = require("express-validator");

const date = new Date();

async function register_teacher(req,resp,next){

    try{
        // const hashpassword = await bcrypt.hash(); // do ehile frontend
        const teacher_reg_data =  new teacher.teacher_register_model({
            uniqueid:req.body.teacher_id.trim(),
            name:req.body.teacher_name.trim(),
            password:req.body.teacher_password.trim(),
            role:"teacher",
            mobileno:req.body.teacher_no.trim()
        })

        // helper.generateAuthToken(req,resp,next);

        helper.generateOtp(req,resp,next,teacher_reg_data);

    }catch(e)
    {
        console.log(e);
    }
}

async function create_classroom(req,resp,next){

    try{

        const teach_data = req.cookies.Teach_data;
        console.log(teach_data);
        const check_sub = await teacher.teacher_classroom_model.find({$and:[{year:req.body.select1},{discipline:req.body.discipline},{subject:req.body.subject},{semester:req.body.select2}]});
        console.log(check_sub)
        if(check_sub.length != 0)
        {
            return resp.render("create_classroom",{copy:"Class already present"});
        }


        const create_class =  new teacher.teacher_classroom_model({
            uniqueid:req.cookies.Teach_data,
            year:req.body.select1,
            discipline:req.body.discipline,
            semester:req.body.select2,
            subject:req.body.subject,
            // stud_capacity:70,
            roll_range:req.body.roll_range,
            // create_qr_dates:["27/2/2023"],
        })

        const status = await create_class.save();
        console.log(status);
        // next()
        resp.render("create_classroom",{success:"Classroom created Successfully"});

    }catch(e)
    {
        console.log(e)
    }
}

async function login_teacher_verify(req,resp,next){

    try{
        const unique_id = req.body.teacher_name;
        const password = req.body.teacher_password;

        // console.log(unique_id, password); Printing unique id and password
        const verify_id = await teacher.teacher_register_model.find({uniqueid:unique_id}).select({name:1});

        if(verify_id.length == 0)
        {
            return resp.render("login",{msg:"ID not found"})
        }

        const verify_password = await teacher.teacher_register_model.find({uniqueid:unique_id}).select({password:1});
        // console.log(verify_password[0].password); printing password 

        
        if(password == verify_password[0].password)
        {
        const token = await helper.generateAuthToken(req,resp,next);
        console.log(typeof(token));

        console.log("Return token : "+token);
        helper.createCookie(req,resp,next,unique_id,token);

        resp.redirect("./teacher_menu")
        }
        else{
            return resp.render("login",{error:"Invalid Credentials"})
        }

    }catch(e)
    {
        console.log(e);
    }
}

async function  create_qrcode(req,resp, auth_String,subject)
{
    try{
        Qrcode.toDataURL(auth_String, function(err, QR_code)
        {
            if(err) {return console.log("error occurred")}

            else
            {
                console.log("qr created");
            resp.send("<img src = "+QR_code+" width='1000px' height='1000px'>")
            
            }
        })
        // setTimeout(refresh_qrString.bind(null,data),1000)
        setTimeout(function(){
            refresh_qrString(req,subject)
        },300000)
        
    }catch(e)
    {
        console.log(e)
    }
}



async function create_qr(req, resp, next)
{
    try{
        console.log(req.body.select1,req.body.select2,req.body.discipline);
        const check_sub = await teacher.teacher_classroom_model.find({$and:[{year:req.body.select1},{discipline:req.body.discipline},{subject:req.body.subject},{semester:req.body.select2}]});
        console.log(check_sub)
        if(check_sub.length == 0)
        {
            return resp.render("teacher_menu",{copy:"Class is not created for the requested QR code"});
        }

        const year = req.body.select1
        const discipline = req.body.discipline
        const sem = req.body.select2
        const subject = req.body.subject;

        const random_str = random.generate(7);
        const auth_String = random_str + " "+ year + " " + discipline + " " + sem + " " + subject;
        // console.log(auth_String);

        console.log(auth_String);
        const data = req.cookies.Teach_data;
        const status = await teacher.teacher_classroom_model.findOneAndUpdate({uniqueid:data,subject:subject},{
            $set:{
                authString:auth_String,
            },
            $push:{
                create_qr_dates: date.toLocaleDateString() 
            }
        },{new:true})
        console.log(status);
        create_qrcode(req, resp, auth_String,subject)
        
    }catch(e)
    {
        console.log(e)
    }
}


async function refresh_qrString(req,subject)
{
    try
    {
        const data = req.cookies.Teach_data;
        console.log(subject);
        const status = await teacher.teacher_classroom_model.findOneAndUpdate({uniqueid:data,subject:subject},{
            $set:{
                authString:null
            }
        },{new:true})
        console.log("Refresh String :",status);
    }catch(e)
    {
        console.log(e);
    }
}


async function get_sheet(req,resp)
{

    try{
    const teacher_id = req.cookies.Teach_data;
    console.log("Teacher ID : ",teacher_id);
    const teach_data = await teacher.teacher_classroom_model.find({uniqueid:teacher_id})
    // console.log("Teacher Data : ",teach_data,typeof(teach_data)); Checking the object

    if(teach_data.length==0)
    {
        return resp.render("create_classroom",{data:"Please create classroom first"})
    }else{

    resp.render("classroom_menu",{teach_data:teach_data,data:"data"});}

    console.log("Teacher Info : ",teach_data[0].year,"\n\n")
    }
    catch(e)
    {
        // resp.render("teacher_menu",{data:"Classroom not created"})
        // console.log(e); Data not found of
    }

}

async function verifyStud(req,resp)
{    
    try{
        const data = req.cookies.stud_data;
        const details = data.split(" ");
        const qr_data = req.body.qrdata;
        const qr_details = qr_data.split(" ");
        console.log(data,qr_data);
        const subject = qr_details[4];

        const teach_qr_data = req.body.qrdata;
        const split_data = teach_qr_data.split(" ");
        console.log(typeof(split_data));
        const teach_details = split_data.toString();  console.log(teach_details);
        const data_teacher = teach_details.split(",");
        console.log(data_teacher[0]);

        const teach_data = await teacher.teacher_classroom_model.find({$and:[{year:data_teacher[1]},{discipline:data_teacher[2]},{subject:data_teacher[4]}]});
        console.log(teach_data[0].authString);

        const stud_data = await student_attendance_model.find({roll_no:details[0],year:details[1],discipline:details[2]})
        const stud_dates = stud_data[0][subject];

        if(stud_dates.includes(date.toLocaleDateString())){
            return resp.render("scanner_QR",{already_present:"You are already Present"})
        }

        if(teach_data[0].authString==req.body.qrdata)
        {
            
        // console.log(teach_data);
        const mark_present = await student_attendance_model.updateOne({roll_no:details[0],year:details[1],discipline:details[2]},{
                $push:{
                    [subject]:date.toLocaleDateString()
                }
        })
        console.log(mark_present)
        resp.render("scanner_QR",{success:"Attendance marked successfull"});
        }else{resp.render("scanner_QR",{msg:"Invalid Qr Scanned"})}
    }
    catch(e)
    {
        console.log(e)
        resp.render("scanner_QR",{msg:"Something went wrong please Login Again!!"})
    }
}

async function InfoDetails(req,resp)
{
    try{
    const year = req.body.select1;
    const semester = req.body.select2;
    const discipline = req.body.discipline;
    const subject = req.body.subject;
    const data = req.cookies.Teach_data;
    // console.log(year,semester,discipline,subject);
    const dept = year + discipline

    const student_data = await student_register_model.find({$and:[{year:year},{discipline:discipline}]}).sort({roll_no:1})
    console.log("Student data :",student_data);
    // const student_attend = await student_attendance_model.find({$and:[{year:year},{discipline:discipline}]}).select({[subject]:1})
    // console.log("Student attendanace : ",student_attend[0][subject][1]);

    // const teacher_atten = await teacher.teacher_classroom_model.find({$and:[{uniqueid:data},{year:year},{discipline:discipline},{subject:subject}]}).select({create_qr_dates:1})
    // console.log(teacher_atten[0].create_qr_dates);
    
    resp.render("all_student_details",{student_data :student_data,dept:dept})
    }
    catch(e)
    {
        console.log(e)
    }
}

async function allDetails(req,resp)
{
    try{
    const subject= req.body.subject;
    const year = req.body.year;
    const discipline = req.body.discipline;
    const semester = req.body.semester;

    console.log(year,subject,discipline,semester);

    const stud_data = await student_attendance_model.find({$and:[{year:year},{discipline:discipline},{semester:semester}]}).select({[subject]:1,roll_no:1,name:1}).sort({roll_no:1});
    console.log(stud_data[0][subject][0]); // printind student date
    console.log(stud_data);


    const teach_data = await teacher.teacher_classroom_model.find({$and:[{year:year},{discipline:discipline},{subject:subject}]}).select({create_qr_dates:1});
    console.log(teach_data[0].create_qr_dates);

    const dates = teach_data[0].create_qr_dates

    resp.render("all_student_attendance",{stud_data:stud_data,dates:dates,dept:year+discipline,subject:subject})
    }
    catch(e)
    {
        resp.render("all_student_attendance",{error_msg:"Data not found"})
        console.log(e)
    }
}

module.exports= {register_teacher,create_classroom,login_teacher_verify, create_qr,get_sheet,verifyStud,InfoDetails,allDetails};