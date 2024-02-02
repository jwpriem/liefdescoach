// api/index.js

const express = require('express')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const postmark = require("postmark");
var client = new postmark.ServerClient(process.env.POSTMARK);

app.post('/bookingEmail', function (req, res) {
  const { new_booking_name, lessondate, spots, bookings, calendar_link_apple, calendar_link_gmail, calendar_link_outlook } = req.body;
  console.log(req.body);
    const email = client.sendEmailWithTemplate({
          "From": "info@ravennah.com",
          "To": "jwpriem@gmail.com",
          "TemplateAlias": "lesson",
          "TemplateModel": {
            "body": null, // You can also pass this from the request body if needed
            "new_booking_name": new_booking_name,
            "lessondate": lessondate,
            "spots": spots,
            "bookings": bookings,
            "calendar_link_apple": calendar_link_apple,
            "calendar_link_gmail": calendar_link_gmail,
            "calendar_link_outlook": calendar_link_outlook
          }
    }).then(() => {
      console.log(error)
      res.send('Email sent successfully');
    }).catch(error => {
      res.status(500).send('Error sending email: ' + error.message);
    });
})

app.post('/cancelBookingEmail', function (req, res) {
  console.log('hoi')
  const { booking_name, lessondate, spots, bookings } = req.body;
  console.log(req.body);
  const email = client.sendEmailWithTemplate({
    "From": "info@ravennah.com",
    "To": "jwpriem@gmail.com",
    "TemplateAlias": "lesson-cancel",
    "TemplateModel": {
      "body": null, // You can also pass this from the request body if needed
      "booking_name": booking_name,
      "lessondate": lessondate,
      "spots": spots,
      "bookings": bookings
    }
  }).then(() => {
    console.log('send')
    res.send('Email sent successfully');
  }).catch(error => {
    console.log(error)
    res.status(500).send('Error sending email: ' + error.message);
  });
})


export default {
  path: '/api',
  handler: app
}