const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

const sendVerificationEmail = async (email, userId, userType, token) => {
  const verificationUrl = `http://localhost:5000/verify-email?userId=${userId}&userType=${userType}&token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Vérifiez votre adresse e-mail",
    html: `
      <h3>Vérification de l'e-mail</h3>
      <p>Veuillez cliquer sur le lien suivant pour vérifier votre adresse e-mail :</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Ce lien expire dans 24 heures.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };