import { defineNuxtPlugin } from '#app';

const rav = {
    scrollTo(id: string) {
        const element = document.querySelector(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
            });
        }
    },

    setErrorMessages(form: Record<string, any>) {
        const errors: Array<{ field: string; error: string }> = [];
        for (const [fieldName, validations] of Object.entries(form)) {
            if (fieldName.indexOf('$') !== -1) {
                continue;
            }

            for (const [validationName, validationResult] of Object.entries(validations)) {
                if (validationName.indexOf('$') !== -1 || validationResult !== false) {
                    continue;
                }

                let errorMessage = validationName;
                switch (validationName) {
                    case 'required':
                        errorMessage = 'is een verplicht veld';
                        break;
                        case 'email':
                            errorMessage = 'moet een e-mailadres zijn';
                            break;
                            case 'numeric':
                                errorMessage = 'moet een nummer zijn';
                                break;
                                case 'minLength':
                                    errorMessage = `moet uit minstens ${validations.$params.minLength.min} karakters bestaan`;
                                    break;
                                    case 'maxLength':
                                        errorMessage = `mag uit maximaal ${validations.$params.maxLength.max} karakters bestaan`;
                                        break;
                                        case 'sameAsPassword':
                                            errorMessage = 'moet gelijk zijn aan huidige wachtwoord';
                                            break;
                                            case 'notSameAsCurrent':
                                                errorMessage = 'mag niet gelijk zijn aan huidige wachtwoord';
                                                break;
                }

                errors.push({ field: fieldName, error: errorMessage });
            }
        }

        return errors;
        },

    getErrorMessage(field: string, errors: Array<{ field: string; error: string }>) {
        const error = errors.find(error => error.field === field);
        return error ? error.error : '';
        },

    formatDateInDutch(date: string, isLesson: boolean = false) {
        const dayjs = useDayjs()
        
        const lessonDate = dayjs(date).utc();
        const startTime = lessonDate.format('h.mm');
        const endTime = lessonDate.add(1, 'hour').format('h.mm');
        return isLesson ? `${lessonDate.format('dddd D MMMM')} van ${startTime} tot ${endTime} uur` : lessonDate.format('D MMMM YYYY');
    },

    isFutureBooking(lessonDate: string) {
        const dayjs = useDayjs()
        
        return dayjs().isBefore(dayjs(new Date(lessonDate)))
    },
    checkCancelPeriod(lesson: any) {
        const dayjs = useDayjs()

        return dayjs().utc().isBefore(dayjs(new Date(lesson.date)).utc().subtract(1, 'day'))
    },
    getCalenderLink(stream: string, date: string) {
        const dayjs = useDayjs()

        const lessonDate = dayjs(new Date(date)).utc()
        const startTime = lessonDate.format('h')
        const startMinutes = lessonDate.format('mm')
        const link = `https://calndr.link/d/event/?service=${stream}&start=${lessonDate.format('YYYY-MM-DD')}%20${startTime}:${startMinutes}&title=Yogales%20Ravennah&timezone=Europe/Amsterdam&location=Emmy%20van%20Leersumhof%2024a%20Rotterdam`
        return link
    },

    formatPhoneNumber(input: string) {
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

    upcomingLessons(lessons: any) {
        const dayjs = useDayjs()
        
        return lessons
        .filter((lesson: any) => {
            const lessonDate = dayjs(new Date(lesson.date))
            return dayjs().isBefore(lessonDate)
        })
    },

    checkAvailability(lesson: any, student: any) {
        console.log(lesson)
        return lesson ? !lesson.bookings.some((x: any) => x.students.$id == student.$id) : false
    }
};

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.provide('rav', rav);
});
