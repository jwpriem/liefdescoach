import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin(nuxtApp => {
    const dayjs = useDayjs()

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
            const lessonDate = dayjs(date).utc();
            const startTime = lessonDate.format('H.mm');
            const endTime = lessonDate.add(1, 'hour').format('H.mm');
            return isLesson ? `${lessonDate.format('dddd D MMMM')} van ${startTime} tot ${endTime} uur` : lessonDate.format('D MMMM YYYY');
        },

        isFutureBooking(lessonDate: string) {
            return dayjs().isBefore(dayjs(new Date(lessonDate)))
        },
        checkCancelPeriod(lesson: any) {
            return dayjs().utc().isBefore(dayjs(new Date(lesson.date)).utc().subtract(1, 'day'))
        },
        getCalenderLink(stream: string, date: string, type: string = 'hatha yoga') {
            const lessonType = type == 'peachy bum' ? 'Peachy Bum les' : 'Hatha Yoga les'
            const address = type == 'peachy bum' ? 'Kosboulevard 5, 3059 XZ Rotterdam' : 'Emmy van Leersumhof 24a, 3059 LT Rotterdam'
            const lessonDate = dayjs(new Date(date)).utc()
            const startTime = lessonDate.format('H')
            const startMinutes = lessonDate.format('mm')
            return `https://calndr.link/d/event/?service=${stream}&start=${lessonDate.format('YYYY-MM-DD')}%20${startTime}:${startMinutes}&title=${lessonType}%20Ravennah&timezone=Europe/Amsterdam&location=${encodeURIComponent(address)}`
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
            return lessons
                .filter((lesson: any) => {
                    const lessonDate = dayjs(new Date(lesson.date))
                    return dayjs().isBefore(lessonDate)
                })
        },

        checkAvailability(lesson: any, student: any) {
            return lesson ? !lesson.bookings.some((x: any) => x.students.$id == student.$id) : false
        },

        checkLessonType(type: string) {
            return type == 'peachy bum' ? 'Peachy Bum' : 'Hatha Yoga'
        },

        getLessonTitle(lesson: any) {
            if (lesson.type == 'guest lesson') {
                return `Yin-Yang Yoga door gastdocent ${lesson.teacher}`
            }
            return rav.checkLessonType(lesson.type)
        },

        getLessonDescription(lesson: any) {
            if (lesson.type == 'guest lesson') {
                return `Yin-Yang Yoga door gastdocent <span class="text-yellow-600">${lesson.teacher}</span>`
            }
            return rav.checkLessonType(lesson.type)
        }
    };

    nuxtApp.provide('rav', rav);
});
