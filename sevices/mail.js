const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SG_KEY)

const sendSGMail = async ({
    from = '123@gmail.com',
    to,
    subject,
    content,
    attachements,
    text
})=>{
    try{

        const msg = {
            from,
            to,
            subject,
            html,
            attachements,
            html:content,
            text
        }
        return sgMail.send(msg)
    }catch(err){
        console.log(err)
    }

}
module.exports = sendSGMail
