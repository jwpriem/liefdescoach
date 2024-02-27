import Vue from 'vue'
import dayjs from 'dayjs';
import 'dayjs/locale/nl';
const utc = require('dayjs/plugin/utc');

const rav = {
  scrollTo (id) {
    return document.querySelector(id).scrollIntoView({
      behavior: 'smooth'
    })
  },
  setErrorMessages (form) {
    const errors = []
    for (const field of Object.entries(form)) {
      if (field[0].indexOf('$')) {
        for (const item of Object.entries(field[1])) {
          if (item[0].indexOf('$')) {
            if (item[1] === false) {
              const error = {}
              error.field = field[0]
              error.error = item[0]

              if (item[0] === 'required') {
                error.error = 'is een verplicht veld'
              }

              if (item[0] === 'email') {
                error.error = 'moet een e-mailadres zijn'
              }
              if (item[0] === 'numeric') {
                error.error = 'moet een nummer zijn'
              }
              if (item[0] === 'minLength') {
                error.error =
                  'moet uit minstens ' +
                  field[1].$params.minLength.min +
                  ' karakters bestaan'
              }
              if (item[0] === 'maxLength') {
                error.error =
                  'mag uit maximaal ' +
                  field[1].$params.maxLength.max +
                  ' karakters bestaan'
              }
              if (item[0] === 'sameAsPassword') {
                error.error = 'moet gelijk zijn aan huidige wachtwoord'
              }

              if (item[0] === 'notSameAsCurrent') {
                error.error = 'mag niet gelijk zijn aan huidige wachtwoord'
              }

              errors.push(error)
            }
          }
        }
      }
    }
    return errors
  },
  getErrorMessage (field, errors) {
    return errors.find(error => error.field === field)
      ? errors.find(error => error.field === field).error
      : ''
  },
  formatDateInDutch(lesson, isLesson = false) {
    dayjs.locale('nl'); // Set locale to Dutch
    dayjs.extend(utc)

    const lessonDate = dayjs(new Date(lesson)).utc()
    const startTime = lessonDate.format('h.mm')
    const endTime = lessonDate.add(1, 'hour').format('h.mm')
    const formattedDate = isLesson ? `${lessonDate.format('dddd D MMMM')} van ${startTime} tot ${endTime} uur` : lessonDate.format('D MMMM YYYY')


    return formattedDate
  },
  isFutureBooking(lesson) {
    const lessonDate = dayjs(new Date(lesson.date))
    return dayjs().isBefore(lessonDate)
  },
  checkCancelPeriod(lesson) {
    dayjs.extend(utc)

    return dayjs().utc().isBefore(dayjs(new Date(lesson.date)).utc().subtract(1, 'day'))
  },
  getCalenderLink(stream, date) {
    dayjs.locale('nl'); // Set locale to Dutch
    dayjs.extend(utc)

    const lessonDate = dayjs(new Date(date)).utc()
    const startTime = lessonDate.format('h')
    const link = `https://calndr.link/d/event/?service=${stream}&start=${lessonDate.format('YYYY-MM-DD')}%20${startTime}:00&title=Yogales%20Ravennah&timezone=Europe/Amsterdam&location=Emmy%20van%20Leersumhof%2024a%20Rotterdam`
    return link
  },
  formatPhoneNumber(input) {
    // Remove all non-digit characters
    let digits = input.replace(/\D/g, '');

    // Check if the number starts with '06' and replace with '316'
    if (digits.startsWith('06')) {
      digits = '31' + digits.substring(1);
    }

    // Validate if the number is now in the correct format
    if (!/^31[0-9]{9}$/.test(digits)) {
      console.log('Invalid phone number format');
    }

    // Reconstruct the phone number with the country code +31
    return `+${digits}`;
  },
  upcomingLessons(lessons) {
    return lessons
        .filter(lesson => {
          const lessonDate = dayjs(new Date(lesson.date))
          return dayjs().isBefore(lessonDate)
        })
  },
  checkAvailability(lesson, student) {
    return lesson ? !lesson.bookings.some(x => x.students.$id == student.$id) : false
  }
}

Vue.prototype.rav = rav

export default ({ app }, inject) => {
  inject('rav', rav)
}
