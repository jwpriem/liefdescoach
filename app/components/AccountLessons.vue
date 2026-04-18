<script setup lang="ts">
const { isAdmin } = useAuth();
const { handleBooking, cancelBooking } = useBookingActions();
const { set: setOnBehalfOf } = useOnBehalfOf();
const dayjs = useDayjs();
const { $rav } = useNuxtApp();

const [
    { data: adminLessonsData, refresh: refreshLessons },
    { data: adminUsersData },
] = await Promise.all([
    useAsyncData("admin-lessons", () =>
        $fetch<any>("/api/lessonsWithBookings"),
    ),
    useAsyncData("admin-users", () => $fetch<any>("/api/users")),
]);

const lessons = computed(() => adminLessonsData.value?.rows ?? []);
const students = computed(() => adminUsersData.value?.users ?? []);

const refreshUsers = async () => {
    await refreshNuxtData("admin-users");
};

const state = reactive({
    onlyFutureLessons: false,
    bookForUser: false,
    injuryPopup: null as { name: string; injury: string } | null,
    addBookingUser: null,
    addBookingLesson: null,
    createLesson: false,
    createLessonDate: new Date(),
    createLessonHours: "09",
    createLessonMinutes: "45",
    createLessonType: "hatha yoga",
    createLessonTeacher: null,
    teachers: [
        {
            label: "Ravennah",
            value: null,
        },
        {
            label: "Bo Bol",
            value: "Bo Bol",
        },
    ],
    types: [
        {
            label: "Hatha Yoga",
            value: "hatha yoga",
        },
        {
            label: "Gastles",
            value: "guest lesson",
        },
        {
            label: "Peachy Bum",
            value: "peachy bum",
        },
    ],
    hours: [
        "00",
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
    ],
    minutes: ["00", "15", "30", "45"],
});

function cancel() {
    state.addBookingUser = null;
    state.addBookingLesson = null;
    state.bookForUser = false;
}

function cancelLesson() {
    state.createLessonDate = new Date();
    state.createLessonType = "hatha yoga";
    state.createLessonTeacher = null;
    state.createLesson = false;
}

const isBooking = ref(false);
async function book() {
    isBooking.value = true;
    try {
        if (state.addBookingUser) setOnBehalfOf(state.addBookingUser);
        await handleBooking(state.addBookingLesson, { extraSpot: true });
        state.addBookingUser = null;
        state.addBookingLesson = null;
        state.bookForUser = false;
    } finally {
        isBooking.value = false;
    }
}

const isCreatingLesson = ref(false);
async function createNewLesson() {
    isCreatingLesson.value = true;
    try {
        state.createLessonDate.setUTCHours(
            parseInt(state.createLessonHours, 10),
            parseInt(state.createLessonMinutes, 10),
            0,
            0,
        );

        await $fetch("/api/createLesson", {
            method: "post",
            body: {
                date: state.createLessonDate.toISOString(),
                type: state.createLessonType,
                teacher: state.createLessonTeacher,
            },
        });

        cancelLesson();
        await refreshLessons();
    } finally {
        isCreatingLesson.value = false;
    }
}

const { sortStudents, getLessonBookingsWithLabels } = useLessonBookings();

// ⚡ Bolt: Move expensive O(N log N) sorting and allocations out of the template
// ⚡ Bolt: Avoid allocating heavy dayjs objects inside filter loops by using native Date time comparison
// ⚡ Bolt: Consolidate multiple array operations (.filter, .map) into a single .reduce() loop to turn O(k*N) into O(N) and minimize intermediate array allocations.
const futureLessons = computed(() => {
    const nowTime = Date.now();
    return lessons.value.reduce((acc: any[], l) => {
        if (new Date(l.date).getTime() > nowTime) {
            acc.push({
                ...l,
                processedBookings: getLessonBookingsWithLabels(
                    l.bookings || [],
                ),
            });
        }
        return acc;
    }, []);
});

const computedLessons = computed(() => {
    return lessons.value.map((lesson) => {
        const regularCount = (lesson.bookings || []).filter(
            (b: any) => b.source !== "classpass",
        ).length;
        const spots = 9 - regularCount;
        const isFull = regularCount >= 9;
        const spotsContext = spots === 1 ? "plek" : "plekken";
        const spotsText = isFull ? " (Vol)" : ` (Nog ${spots} ${spotsContext})`;

        return {
            label: $rav.formatDateInDutch(lesson.date) + spotsText,
            value: lesson,
            disabled: isFull,
        };
    });
});

const computedStudents = computed(() => {
    return students.value.map((student) => {
        const isDisabled = false;
        return {
            label: student.name,
            value: student,
            disabled: isDisabled,
        };
    });
});

const managedLesson = ref<any>(null);

// ⚡ Bolt: Memoize managed lesson bookings to prevent re-evaluation on every patch
const processedManagedBookings = computed(() =>
    managedLesson.value
        ? getLessonBookingsWithLabels(managedLesson.value.bookings || [])
        : [],
);

const classpassBookingUser = ref<any>(null);
const showNewStudentForm = ref(false);
const isBookingClasspass = ref(false);
const NEW_STUDENT_SENTINEL = {
    $id: "__new__",
    name: "+ Nieuwe deelnemer toevoegen",
};

const classpassStudentOptions = computed(() => {
    const existing = students.value.map((s: any) => ({
        label: s.name,
        value: s,
    }));
    return [
        { label: NEW_STUDENT_SENTINEL.name, value: NEW_STUDENT_SENTINEL },
        ...existing,
    ];
});

function onClasspassStudentSelect(option: any) {
    if (option?.$id === "__new__") {
        showNewStudentForm.value = true;
        classpassBookingUser.value = null;
    } else {
        showNewStudentForm.value = false;
        classpassBookingUser.value = option;
    }
}

async function onNewStudentCreated(student: any) {
    showNewStudentForm.value = false;
    await refreshUsers();
    classpassBookingUser.value = student;
}

function resetClasspassState() {
    classpassBookingUser.value = null;
    showNewStudentForm.value = false;
}

async function addClasspassBooking() {
    if (!managedLesson.value || !classpassBookingUser.value) return;
    isBookingClasspass.value = true;
    try {
        setOnBehalfOf(classpassBookingUser.value);
        await handleBooking(managedLesson.value, {
            source: "classpass",
            extraSpot: true,
        });
        resetClasspassState();
        await refreshLessons();
        const updated = lessons.value.find(
            (l: any) => l.$id === managedLesson.value.$id,
        );
        if (updated) managedLesson.value = updated;
    } finally {
        isBookingClasspass.value = false;
    }
}

function openManage(lesson: any) {
    managedLesson.value = lesson;
    resetClasspassState();
}

function closeManage() {
    managedLesson.value = null;
    resetClasspassState();
}

const confirmRemoveBooking = ref(false);
const pendingRemoveBooking = ref<any>(null);

function promptRemoveBooking(booking: any) {
    pendingRemoveBooking.value = booking;
    confirmRemoveBooking.value = true;
}

async function onConfirmRemoveBooking() {
    if (pendingRemoveBooking.value) {
        await cancelBooking(pendingRemoveBooking.value);
        pendingRemoveBooking.value = null;
    }
}

const confirmDeleteLesson = ref(false);

async function deleteManagedLesson(lesson: any) {
    confirmDeleteLesson.value = true;
}

async function onConfirmDeleteLesson() {
    closeManage();
    await $fetch("/api/deleteLesson", {
        method: "POST",
        body: { lessonId: managedLesson.value.$id },
    });
    await refreshLessons();
}
</script>

<template>
    <div v-if="isAdmin && lessons && students">
        <div class="w-full">
            <div class="md:flex justify-between items-center mb-6">
                <h2 class="text-2xl md:text-4xl uppercase font-black">
                    <span class="emerald-underline text-emerald-900"
                        >Lessen</span
                    ><span class="text-emerald-700">.</span>
                </h2>
                <div class="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
                    <UButton
                        color="primary"
                        icon="i-lucide-graduation-cap"
                        variant="solid"
                        size="lg"
                        @click="state.createLesson = !state.createLesson"
                        >Nieuw</UButton
                    >
                    <UButton
                        color="primary"
                        icon="i-lucide-calendar-plus"
                        variant="solid"
                        size="lg"
                        @click="state.bookForUser = !state.bookForUser"
                        >Boeking</UButton
                    >
                    <UButton
                        color="primary"
                        icon="i-lucide-archive"
                        variant="outline"
                        size="lg"
                        to="/archief"
                        >Archief</UButton
                    >
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    v-for="lesson in futureLessons"
                    :key="lesson.$id"
                    class="rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-6"
                >
                    <div class="space-y-3">
                        <div class="flex items-start justify-between">
                            <div>
                                <span
                                    class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide"
                                    >Les</span
                                >
                                <span
                                    class="block text-gray-100 mt-0.5"
                                    v-html="$rav.getLessonDescription(lesson)"
                                ></span>
                            </div>
                            <UButton
                                aria-label="Les beheren"
                                icon="i-lucide-pencil"
                                variant="ghost"
                                size="md"
                                class="text-gray-400 hover:text-white -mt-1 -mr-2"
                                @click="openManage(lesson)"
                            />
                        </div>
                        <div>
                            <span
                                class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide"
                                >Datum</span
                            >
                            <span class="block text-gray-100 mt-0.5">{{
                                $rav.formatDateInDutch(lesson.date, true)
                            }}</span>
                        </div>
                        <div>
                            <span
                                class="text-xs font-medium text-emerald-400/80 uppercase tracking-wide"
                                >Boekingen ({{
                                    (lesson.bookings || []).filter(
                                        (b: any) => b.source !== "classpass",
                                    ).length
                                }}/9<span
                                    v-if="
                                        (lesson.bookings || []).some(
                                            (b: any) =>
                                                b.source === 'classpass',
                                        )
                                    "
                                    class="text-sky-300"
                                >
                                    +
                                    {{
                                        (lesson.bookings || []).filter(
                                            (b: any) =>
                                                b.source === "classpass",
                                        ).length
                                    }}
                                    Classpass</span
                                >)</span
                            >
                            <div class="mt-1">
                                <span
                                    v-for="booking in lesson.processedBookings"
                                    :key="booking.$id"
                                    class="flex items-center gap-1 text-base text-gray-300"
                                >
                                    <button
                                        class="text-left hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 -ml-1"
                                        @click="
                                            navigateTo(
                                                `/admin/users/${booking.students.$id}`,
                                            )
                                        "
                                    >
                                        {{ booking.students.name }}
                                    </button>
                                    <UBadge
                                        v-if="booking.isFirstTime"
                                        color="warning"
                                        variant="subtle"
                                        size="xs"
                                        >Eerste keer</UBadge
                                    >
                                    <UBadge
                                        v-if="booking.isExtraSpot"
                                        color="success"
                                        variant="subtle"
                                        size="xs"
                                        >Extra plek</UBadge
                                    >
                                    <UBadge
                                        v-if="booking.source === 'classpass'"
                                        color="info"
                                        variant="subtle"
                                        size="xs"
                                        >Classpass</UBadge
                                    >
                                    <button
                                        v-if="booking.students.injury"
                                        aria-label="Bekijk blessure details"
                                        class="flex items-center justify-center flex-shrink-0 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded p-0.5"
                                        @click="
                                            state.injuryPopup = {
                                                name: booking.students.name,
                                                injury: booking.students.injury,
                                            }
                                        "
                                    >
                                        <UIcon
                                            name="i-lucide-heart-pulse"
                                            class="w-4 h-4 text-red-500 block"
                                        />
                                    </button>
                                    <UTooltip
                                        v-if="booking.students.pregnancy"
                                        text="Zwanger"
                                    >
                                        <UIcon
                                            name="i-lucide-baby"
                                            class="w-4 h-4 text-pink-500 flex-shrink-0"
                                        />
                                    </UTooltip>
                                </span>
                                <span
                                    v-if="!lesson.bookings?.length"
                                    class="text-sm text-gray-500"
                                    >Geen boekingen</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: Injury info -->
        <div
            v-if="state.injuryPopup"
            class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
            @click.self="state.injuryPopup = null"
        >
            <div
                class="w-full max-w-md rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8"
            >
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <UIcon
                            name="i-lucide-heart-pulse"
                            class="w-5 h-5 text-red-500"
                        />
                        <h2
                            class="text-xl font-bold text-emerald-100 tracking-tight"
                        >
                            Blessure info
                        </h2>
                    </div>
                    <UButton
                        aria-label="Sluiten"
                        icon="i-lucide-x"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        @click="state.injuryPopup = null"
                    />
                </div>
                <p class="text-sm font-medium text-gray-400 mb-1">
                    {{ state.injuryPopup.name }}
                </p>
                <p class="text-base text-gray-200">
                    {{ state.injuryPopup.injury }}
                </p>
            </div>
        </div>

        <!-- Modal: Book for user -->
        <div
            v-if="state.bookForUser && lessons.length && students.length"
            class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
        >
            <div
                class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10"
            >
                <div class="w-full flex flex-col gap-y-5">
                    <h2
                        class="text-2xl font-bold text-emerald-100 tracking-tight"
                    >
                        Voeg boeking toe
                    </h2>

                    <div>
                        <label
                            class="block text-sm font-medium text-gray-300 mb-1.5"
                            >Les</label
                        >
                        <USelectMenu
                            icon="i-lucide-graduation-cap"
                            size="lg"
                            color="primary"
                            variant="outline"
                            v-model="state.addBookingLesson"
                            :items="computedLessons"
                            class="w-full"
                            value-key="value"
                            :search-input="false"
                        />
                    </div>

                    <div v-if="state.addBookingLesson">
                        <label
                            class="block text-sm font-medium text-gray-300 mb-1.5"
                            >Gebruiker</label
                        >
                        <USelectMenu
                            icon="i-lucide-user"
                            size="lg"
                            color="primary"
                            variant="outline"
                            v-model="state.addBookingUser"
                            :items="computedStudents"
                            class="w-full"
                            value-key="value"
                            :search-input="{ placeholder: 'Zoek gebruiker...' }"
                        />
                    </div>

                    <div class="flex gap-3 mt-2">
                        <UTooltip
                            :text="
                                !state.addBookingUser && !state.addBookingLesson
                                    ? 'Selecteer eerst een les en gebruiker'
                                    : 'Voeg boeking toe'
                            "
                        >
                            <div>
                                <UButton
                                    :loading="isBooking"
                                    color="primary"
                                    variant="solid"
                                    size="lg"
                                    @click="book()"
                                    :disabled="
                                        !state.addBookingUser &&
                                        !state.addBookingLesson
                                    "
                                    >Voeg toe</UButton
                                >
                            </div>
                        </UTooltip>
                        <UButton
                            color="primary"
                            variant="outline"
                            size="lg"
                            @click="cancel()"
                            >Annuleer</UButton
                        >
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: Manage lesson -->
        <div
            v-if="managedLesson"
            class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
        >
            <div
                class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10"
            >
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <h2
                            class="text-2xl font-bold text-emerald-100 tracking-tight"
                        >
                            Les beheren
                        </h2>
                        <p class="text-gray-400 text-sm mt-1">
                            {{
                                $rav.formatDateInDutch(managedLesson.date, true)
                            }}
                        </p>
                    </div>
                    <UButton
                        aria-label="Sluiten"
                        icon="i-heroicons-x-mark-20-solid"
                        variant="ghost"
                        size="sm"
                        class="text-gray-400 hover:text-white -mt-1 -mr-2"
                        @click="closeManage()"
                    />
                </div>

                <div class="mb-6">
                    <h3
                        class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3"
                    >
                        Deelnemer verwijderen
                    </h3>
                    <div
                        v-if="managedLesson.bookings?.length"
                        class="flex flex-col gap-2"
                    >
                        <div
                            v-for="booking in processedManagedBookings"
                            :key="booking.$id"
                            class="flex items-center justify-between rounded-xl bg-gray-900/60 border border-gray-800/50 px-4 py-2.5"
                        >
                            <span
                                class="flex items-center gap-2 text-sm text-gray-200"
                            >
                                {{ booking.students.name }}
                                <UBadge
                                    v-if="booking.isFirstTime"
                                    color="warning"
                                    variant="subtle"
                                    size="xs"
                                    >Eerste keer</UBadge
                                >
                                <UBadge
                                    v-if="booking.isExtraSpot"
                                    color="success"
                                    variant="subtle"
                                    size="xs"
                                    >Extra plek</UBadge
                                >
                                <UBadge
                                    v-if="booking.source === 'classpass'"
                                    color="info"
                                    variant="subtle"
                                    size="xs"
                                    >Classpass</UBadge
                                >
                                <UTooltip
                                    v-if="booking.students.injury"
                                    :text="booking.students.injury"
                                >
                                    <UIcon
                                        name="i-lucide-heart-pulse"
                                        class="w-4 h-4 text-red-500"
                                    />
                                </UTooltip>
                                <UTooltip
                                    v-if="booking.students.pregnancy"
                                    text="Zwanger"
                                >
                                    <UIcon
                                        name="i-lucide-baby"
                                        class="w-4 h-4 text-pink-500"
                                    />
                                </UTooltip>
                            </span>
                            <UButton
                                aria-label="Deelnemer verwijderen"
                                icon="i-heroicons-trash-20-solid"
                                variant="ghost"
                                size="xs"
                                class="text-red-400 hover:text-red-300"
                                @click="
                                    promptRemoveBooking(booking);
                                    closeManage();
                                "
                            />
                        </div>
                    </div>
                    <p v-else class="text-sm text-gray-500">Geen deelnemers.</p>
                </div>

                <div class="border-t border-gray-800/50 pt-6 mb-6">
                    <h3
                        class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3"
                    >
                        Classpass deelnemer toevoegen
                    </h3>
                    <p class="text-xs text-gray-500 mb-3">
                        Classpass deelnemers tellen niet mee voor de maximale
                        capaciteit.
                    </p>
                    <div
                        v-if="!showNewStudentForm"
                        class="flex flex-col gap-y-3"
                    >
                        <USelectMenu
                            :model-value="classpassBookingUser"
                            icon="i-lucide-user"
                            size="lg"
                            color="primary"
                            variant="outline"
                            :items="classpassStudentOptions"
                            class="w-full"
                            value-key="value"
                            :search-input="{ placeholder: 'Zoek deelnemer...' }"
                            @update:model-value="onClasspassStudentSelect"
                        />
                        <div class="flex gap-3">
                            <UTooltip
                                :text="!classpassBookingUser ? 'Selecteer eerst een deelnemer' : 'Voeg classpass boeking toe'"
                                class="block w-full"
                            >
                                <div class="w-full">
                                    <UButton
                                        :loading="isBookingClasspass"
                                        :disabled="!classpassBookingUser"
                                        color="info"
                                        variant="solid"
                                        size="md"
                                        icon="i-lucide-plus"
                                        @click="addClasspassBooking"
                                    >
                                        Classpass boeking toevoegen
                                    </UButton>
                                </div>
                            </UTooltip>
                        </div>
                    </div>
                    <NewStudentForm
                        v-else
                        submit-label="Deelnemer aanmaken"
                        @created="onNewStudentCreated"
                        @cancel="showNewStudentForm = false"
                    />
                </div>

                <div class="border-t border-gray-800/50 pt-6">
                    <UButton
                        color="error"
                        variant="soft"
                        icon="i-heroicons-trash-20-solid"
                        @click="deleteManagedLesson(managedLesson)"
                    >
                        Les verwijderen
                    </UButton>
                </div>
            </div>
        </div>

        <!-- Confirm: Remove booking -->
        <ConfirmModal
            v-model="confirmRemoveBooking"
            message="Weet je zeker dat je deze deelnemer wilt verwijderen?"
            @confirm="onConfirmRemoveBooking"
        />

        <!-- Confirm: Delete lesson -->
        <ConfirmModal
            v-model="confirmDeleteLesson"
            message="Weet je zeker dat je deze les wilt verwijderen?"
            @confirm="onConfirmDeleteLesson"
        />

        <!-- Modal: Create lesson -->
        <div
            v-if="state.createLesson && isAdmin"
            class="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4"
        >
            <div
                class="w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-950/50 border border-gray-800/80 backdrop-blur-sm shadow-2xl shadow-emerald-950/20 p-8 sm:p-10"
            >
                <div class="w-full flex flex-col gap-y-5">
                    <h2
                        class="text-2xl font-bold text-emerald-100 tracking-tight"
                    >
                        Voeg les toe
                    </h2>

                    <div>
                        <label
                            class="block text-sm font-medium text-gray-300 mb-1.5"
                            >Datum</label
                        >
                        <UPopover class="w-full">
                            <UButton
                                icon="i-lucide-calendar-days"
                                size="lg"
                                :label="
                                    dayjs(state.createLessonDate).format(
                                        'D MMM, YYYY',
                                    )
                                "
                                color="primary"
                                variant="outline"
                                class="w-full justify-between"
                            />
                            <template #content="{ close }">
                                <LazyDatePicker
                                    v-model="state.createLessonDate"
                                    is-required
                                    @close="close"
                                />
                            </template>
                        </UPopover>
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-gray-300 mb-1.5"
                            >Tijd</label
                        >
                        <div class="flex items-center gap-3">
                            <USelectMenu
                                icon="i-lucide-clock"
                                size="lg"
                                color="primary"
                                variant="outline"
                                v-model="state.createLessonHours"
                                :items="state.hours"
                                class="w-full"
                            />
                            <USelectMenu
                                icon="i-lucide-clock"
                                size="lg"
                                color="primary"
                                variant="outline"
                                v-model="state.createLessonMinutes"
                                :items="state.minutes"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-gray-300 mb-1.5"
                            >Type les</label
                        >
                        <USelectMenu
                            icon="i-lucide-graduation-cap"
                            size="lg"
                            color="primary"
                            variant="outline"
                            v-model="state.createLessonType"
                            :items="state.types"
                            class="w-full"
                            value-key="value"
                            :search-input="false"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-sm font-medium text-gray-300 mb-1.5"
                            >Docent</label
                        >
                        <USelectMenu
                            icon="i-lucide-graduation-cap"
                            size="lg"
                            color="primary"
                            variant="outline"
                            v-model="state.createLessonTeacher"
                            :items="state.teachers"
                            class="w-full"
                            value-key="value"
                            :search-input="false"
                        />
                    </div>

                    <div class="flex gap-3 mt-2">
                        <UButton
                            :loading="isCreatingLesson"
                            color="primary"
                            variant="solid"
                            size="lg"
                            @click="createNewLesson()"
                            >Voeg toe</UButton
                        >
                        <UButton
                            color="primary"
                            variant="outline"
                            size="lg"
                            @click="cancelLesson()"
                            >Annuleer</UButton
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
