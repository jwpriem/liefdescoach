import Vue from 'vue'

const lc = {
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
  }
}

Vue.prototype.lc = lc

export default ({ app }, inject) => {
  inject('lc', lc)
}
