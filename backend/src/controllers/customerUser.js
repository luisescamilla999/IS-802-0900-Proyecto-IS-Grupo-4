const conection = require('../config/connection')//requerimos la conexion a la BD 
const controller = {} //definicion de controller que guardara las rutas
const fs= require('fs')
const path = require('path')
const nodemailer=require('nodemailer')

//////////////////////////outlook
function enviarCorreoOut(destinatario, codigo,res){
    let config= nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secureConnection:false,
        tls: {
            ciphers:'SSLv3'
        },
        auth:{
            user:'plazitanet@outlook.com',
            pass:'htspf445$'
        }
    });
    const opc={
        from:'"Plazita Net" <plazitanet@outlook.com>',
        subject:"Recuperacion de cuenta",
        to: `${destinatario}`,
        text: `Hola, a continuacion te proporcionamos el codigo de verificacion para el cambio de contraseña:   ${codigo}`
    };
    
    config.sendMail(opc, function(error, result,){
        if (error) {return res.json({status:'10'})} //error el enviar email
        else{return res.json({status:'200'})}    //correcto
    })                                   /////////////////////////////////
}

/////////////////////////////////////////////////////////////////

function enviarCorreoGmail(destinatario, codigo,res){
    let config= nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure:true,
        auth:{
            user:'plazitanet1@gmail.com',
            pass:'fktlxsridrbusxrk'
        }
    });
    const opc={
        from:'"Plazita Net" <plazitanet1@gmail.com>',
        subject:"Recuperacion de cuenta",
        to: `${destinatario}`,
        text: `Hola, a continuacion te proporcionamos el codigo de verificacion para el cambio de contraseña:   ${codigo}`
    };
    
    config.sendMail(opc, function(error, result,){
        if (error) {return res.json({status:'10'})} //error el enviar email
        else{return res.json({status:'200'})}    //correcto
    })                                   /////////////////////////////////
}




//funcion de prueba
controller.test = (req,res) => {
    res.send('get routes')
}


//funcion para obtener un usuario por el id
controller.getUser = (req,res) =>{
    const {id} =req.params
    let sql =`select var_phone,bit_status,var_lastname,var_name,var_email,fk_id_department from USER where id_user=${id}`
    conection.query(sql,(err,rows,fields) =>{
        if(err) res.send(err.sqlMessage);
        else{
            res.json(rows)
        }
    })
}

//funcion para insertar un usuario
controller.postUser = (req,res) =>{
    const {fk_id_department,var_email,var_name,var_lastname,tex_password,bit_rol,bit_status,var_phone} = req.body
    let sql1=`SELECT id_user from USER where var_email='${var_email}'`
    //verificar que el correo no ha sido registrado
    let sql=`insert into USER(fk_id_department,var_email,var_name,var_lastname,tex_password,bit_rol,bit_status,var_phone) values(${fk_id_department},'${var_email}','${var_name}',
    '${var_lastname}','${tex_password}',${bit_rol},${bit_status},'${var_phone}')`
    //try {
        conection.query(sql1,(err,rows,fields)=>{
            if(err) res.send({status: '0', id:""}); //error en consulta
            else if(rows.length==0){
                conection.query(sql,(err,rows,fields)=>{
                    if(err) res.send({status: '2', id:""});//error al insertar
                    else{
                        conection.query(sql1,(err,rows,fields)=>{
                            if(err) res.send({status: '3', id:""});//error al consultar id
                            else{
                                res.json({status: '200',id:rows[0].id_user})
                            }
                        })
                    }
                })
            }else{
                res.json({status: '1', id:""})//correo ya existente
            }
        })
    
}

//Funcion para eliminar usuario dado un id
controller.deleteUser = (req,res)=>{
    const {id} = req.params

    let sql =`delete from USER where id_user =${id}`
    conection.query(sql,(err,rows,fields)=>{
        if(err) res.send(err.sqlMessage);
        else{
            res.json({status: 'Usuario Eliminado'})
        }
    })

}

//auth
controller.auth=(req,res)=>{
    const{var_email, tex_password}=req.body
    console.log(var_email&&tex_password)
    console.log(req.body)
    if(var_email&&tex_password){
        let sql=`SELECT id_user,var_email,tex_password,id_user,bit_rol,bit_status from USER where var_email='${var_email}'`
        conection.query(sql,(err, rows, fields)=>{
            if(rows.length!=0){//sino ecuentra el email o las claves no coinciden
                if (tex_password == rows[0].tex_password) {
                    if (rows[0].bit_status[0] == 1) {
                        res.json({status:'200',id:rows[0].id_user})
                    }else{
                        res.json({status:'1',id:'-1'})//es usuario eliminado o dado de baja
                    }
                } else {
                    res.json({status:'0',id:'-1'})//el correo o contraseña son incorrectos
                }
            }else{
                res.json({status:'0',id:'-1'}) //el correo o contraseña son incorrectos
            }
        })
    }else{
        if (!var_email) {
            res.json({status:'3',id:'-1'})// no especifico el correo
        }
        if (!tex_password) {
            res.json({status:'4',id:'-1'})//no especifico la contraseña
        }
        
    }
}

//actualizar pass

controller.updatePasswordUser = (req,res) =>{
    const{var_email,tex_password}=req.body

    let sql1 = `SELECT * from USER where var_email = '${var_email}'`
    let sql2 = `update USER set var_code = null WHERE var_email = '${var_email}'`
    let sql = `update USER set `+
    `tex_password='${tex_password}' `+
    `where var_email = '${var_email}'`
    conection.query(sql1,(err,rows,fields)=>{
        if(err) res.json({status: '0'});//posible error en consulta
        else{
            if (rows[0].var_code != null) {
                conection.query(sql2,(err2,rows,fields)=>{
                    if(err2) res.json({status: '2'});//error al actualizar el codigo a null
                    else{
                        conection.query(sql,(err1,rows1,fields1)=>{
                            if(err1) res.json({status: '3'});//error al no poder actualizar la contraseña
                            else{
                                res.json({status: '200'})//todo salio bien
                            }
                        })
                    }
                })
                
            }else{
                res.json({status: '1'})//el codigo es null, no hubo peticion de codigo
            }
        }
    })
}

/////////////////////generar codigo aleatorio y enviar correo/////////////////////////////

controller.envioCodigoCorreo=(req,res)=>{
    const{var_email}=req.body
    
    let sql1=`SELECT * FROM user WHERE var_email='${var_email}'`
    let sql2=`SELECT bit_status from USER WHERE var_email='${var_email}'`
    let getToken=`SELECT var_code FROM user WHERE var_email='${var_email}'`

    conection.query(sql1,(err,rows,fields)=>{
        if(err) res.json({status: '0', error:err.sqlMessage});//posible error en consulta
        else{
            if(rows.length!=0){//si encontro una fila con el email dado
                conection.query(sql2,(err, rows, fields)=>{ //consultamos si no ha sido dado de baja--bit status
                    
                    if(err) res.json({status:'0', error:err.sqlMessage})//posible error en consulta a BDD
                    else{
                        if(rows[0].bit_status[0]!=0){ //si no ha sido dado de baja
                            let generateToken=`CALL createCode('${var_email}')` //GENERAMOS EL TOKEN al usuario
                            
                            conection.query(generateToken,(err, rows, fields)=>{
                                if(err) res.json({status:'0', error:err.sqlMessage}) //posible error en la consulta a bdd
                                else{
                                    
                                    conection.query(getToken,(err, rows, fields)=>{ //ahora tomamos el token de la bd
                                        if(err) res.json({status:'0', error:err.sqlMessage}) //posible error en la consulta a bdd
                                        else{

                                            //evaluar smtp provider
                                            let n=var_email.search('gmail.com')
                                            let n2=var_email.search('outlook.com')
                                            let n3=var_email.search('hotmail.com')
                                            
                                            if(n2!=-1){
                                                console.log('outlook')
                                                enviarCorreoOut(var_email,rows[0].var_code,res);
                                            }else{
                                                if(n3!=-1){
                                                    enviarCorreoGmail(var_email,rows[0].var_code,res);
                                                }else{
                                                    if(n!=-1){
                                                        enviarCorreoGmail(var_email,rows[0].var_code,res);
                                                    }
                                                }
                                            }
                                        }
                                    })
                                }
                            })
                        }else{res.json({status:'2'})} //status 2: usuario dado de baja sin acceso al sistema
                    }
                })
            }else {res.json({status:'1'})} //status 1: correo invalido
        }
    })
}
//routers.post('/credential', customerU.envioCodigoCorreo )


/////////////////confirmar codigo////////////////////////

controller.confirmaCodigo=(req,res)=>{
    const{var_code, var_email}=req.body;
    

    let consulta=`select * from USER where var_code='${var_code}' and var_email='${var_email}'`

    conection.query(consulta,(err,rows, fields)=>{
        if(err) res.json({status: '0', error:err.sqlMessage});//0:posible error en consulta
        else{
            if(rows.length!=0){ //si encontro una usuario que corresponde con el codigo e email
                res.json({status:'200'}) //200: todo salio  bien
                    }else {   
                        res.json({status:'1'}) //1:codigo invalido
                }    
        }
    })
}

//funcion para actualizar un usuario dado un id
controller.updateUser = (req,res) =>{
    const{id}=req.params
    const{fk_id_department,var_email,var_name,var_lastname,tex_password,bit_rol,bit_status,var_phone}=req.body

    let sql = `update USER set fk_id_department=${fk_id_department}, `+
    `var_email='${var_email}', `+
    `var_name='${var_name}', `+
    `var_lastname='${var_lastname}', `+
    `tex_password='${tex_password}', `+
    `bit_rol=${bit_rol}, `+
    `bit_status=${bit_status}, `+
    `var_phone='${var_phone}' where id_user = ${id}`

    conection.query(sql,(err,rows,fields)=>{
        if(err) res.send(err.sqlMessage);
        else{
            res.json({status: 'Usuario Modificado'})
        }
    })
}

controller.productUser = (req,res) =>{
    const{id}=req.params
    let sql1 = `SELECT DISTINCT(product.id_product),photographs.id_photographs,photographs.blob_file,fk_id_user,fk_id_department,product.var_name,text_description,dou_price,publication_date`
        + ` from product LEFT OUTER JOIN  photographs ON photographs.fk_id_product=product.id_product where `
    sql1 += `product.fk_id_user=${id} ORDER BY publication_date DESC`

    conection.query(sql1,(err,rows,fields)=>{
        if(err) res.json(err);//posible error en consulta
        else{
            const imgdirDelete = fs.readdirSync(path.join(__dirname,'../dbimagesProducts/'))//trae las imagenes guardadas en el servidor
            imgdirDelete.map(img=>{
                fs.unlinkSync(path.join(__dirname,'../dbimagesProducts/'+img))//las elimina, si es que hay imagenes
            })
            rows.map(images=>{
                try {
                    fs.writeFileSync(path.join(__dirname,'../dbimagesProducts/'+images.id_product+"-"+"image.jpeg"),images.blob_file)//trae las imagenes de la base de datos
                    images.blob_file = "localhost:3000/" + images.id_product+"-"+"image.jpeg"
                } catch (error) {
                    console.log(error)
                }
                
            })
            //const imgdir = fs.readdirSync(path.join(__dirname,'../dbimagesProducts/'))//crea un arreglo con el  nombre de las mismas
            res.json(rows)//todo salio bien
            }
        })
}

/*{
    "id_user":"3",
    "fk_id_department":1,
    "var_email":"luis2@gmail.com",
    "var_name":"prueba",
    "var_lastname":"base",
    "tex_password":"12345",
    "bit_rol":1,
    "bit_status":1,
    "var_phone":"98765645"
} */



//exportacion de controler
module.exports = controller