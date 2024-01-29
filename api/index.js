// api/index.js

const express = require('express')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const postmark = require("postmark");
var client = new postmark.ServerClient(process.env.POSTMARK);

app.post('/bookingEmail', function (req, res) {
  const { new_booking_name, lessondate, spots, bookings } = req.body;
    client.sendEmailWithTemplate({
          "From": "info@ravennah.com",
          "To": "info@ravennah.com",
          "TemplateAlias": "lesson",
          "TemplateModel": {
            "body": null, // You can also pass this from the request body if needed
            "new_booking_name": new_booking_name,
            "lessondate": lessondate,
            "spots": spots,
            "bookings": bookings
          }
    }).then(() => {
      res.send('Email sent successfully');
    }).catch(error => {
      res.status(500).send('Error sending email: ' + error.message);
    });
})


export default {
  path: '/api',
  handler: app
}