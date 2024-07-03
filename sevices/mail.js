// const sgMail = require('@sendgrid/mail')

// sgMail.setApiKey(process.env.SG_KEY)

// const sendSGMail = async ({
//     from = '123@gmail.com',
//     to,
//     subject,
//     content,
//     attachements,
//     text
// })=>{
//     try{

//         const msg = {
//             from,
//             to,
//             subject,
//             attachements,
//             html:content,
//             text
//         }
//         return sgMail.send(msg)
//     }catch(err){
//         console.log(err)
//     }

// }
// module.exports = sendSGMail

const { Resend } = require('resend')
const resend = new Resend(process.env.RESEND_KEY)

const sendRSMail = ({
    from = '123@gmail.com',
    to,
    subject,
    content,
    html,
    text
}) => {
    try {
        const msg = {
            from,
            to,
            subject,
            content,
            html,
        }

         return resend.emails.send(msg)
    } catch (err) {
        console.log(err)
    }
}

module.exports = sendRSMail