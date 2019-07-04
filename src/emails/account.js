const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jdanielink@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get alogn with the app.`
    });
}

const sendDeleteEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jdanielink@gmail.com',
        subject: 'We are sorry to see you leave',
        text: `${name}, what we could have done to keep you with us?`
    });
}

module.exports = {
    sendWelcomeEmail,
    sendDeleteEmail
}