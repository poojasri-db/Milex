
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendSellerRegistrationMail = async (
    SELLER_NAME,
    EMAIL
) => {

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: EMAIL,
        subject: "Seller Registration Successful - Ecom_milex",

        text: `
Dear ${SELLER_NAME},

Congratulations!

Your seller registration with Ecom_milex has been successfully submitted.

Registration Details:

Seller Name: ${SELLER_NAME}
Registered Email: ${EMAIL}

Your registration is currently pending admin verification.

Our team will review your submitted business details and documents.
You will receive another notification once your seller account is approved.

Thank you for choosing Ecom_milex.

Best Regards,
Ecom_milex Team
        `
    };

    return await transporter.sendMail(mailOptions);
};



const sendSellerApprovalMail = async (
    SELLER_NAME,
    USERNAME,
    EMAIL
) => {

    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: EMAIL,
        subject: "Seller Account Approved - Ecom_milex",

        text: `
Dear ${SELLER_NAME},

Congratulations!

Your seller registration with Ecom_milex has been approved successfully.

Your seller account is now active.

Your Login Details:

Username: ${USERNAME}

You can now log in to your seller account and start managing your products and orders.

Thank you for choosing Ecom_milex. We look forward to working with you.

Best Regards,
Ecom_milex Team
        `
    };

    return await transporter.sendMail(mailOptions);
};



module.exports = {
    sendSellerRegistrationMail,
    sendSellerApprovalMail
};