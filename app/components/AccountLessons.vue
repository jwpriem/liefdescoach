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
    addBookingUser: null as any,
    addBookingLesson: null as any,
    addBookingType: "regular" as "regular" | "classpass",
    showNewStudentForm: false,
    createLesson: false,
    createLessonDate: new Date(),
    createLessonHours: "09",
    createLessonMinutes: "45",
    createLessonType: "hatha yoga",
    createLessonTeacher: null,
    teachers: [
        { label: "Ravennah", value: null },
        { label: "Bo Bol", value: "Bo Bol" },
    ],
    types: [
        { label: "Hatha Yoga", value: "hatha yoga" },
        { label: "Gastles", value: "guest lesson" },
        { label: "Peachy Bum", value: "peachy bum" },
    ],
    hours: [
        "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
        "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
        "20", "21", "22", "23", "24",
    ],
    minutes: ["00", "15", "30", "45"],
});

function cancel() {
    state.addBookingUser = null;
    state.addBookingLesson = null;
    state.addBookingType = "regular";
    state.showNewStudentForm = false;
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
    if (!state.addBookingLesson || !state.addBookingUser) return;
    isBooking.value = true;
    try {
        setOnBehalfOf(state.addBookingUser);
        await handleBooking(state.addBookingLesson, {
            extraSpot: true,
            source: state.addBookingType,
        });
        cancel();
    } finally {
        isBooking.value = false;
    }
}

const NEW_STUDENT_SENTINEL = {
    $id: "__new__",
    name: "+ Nieuwe deelnemer toevoegen",
};

async function onNewStudentCreated(student: any) {
    state.showNewStudentForm = false;
    await refreshUsers();
    state.addBookingUser = student;
}

function onUserSelect(option: any) {
    if (option?.$id === "__new__") {
        state.showNewStudentForm = true;
        state.addBookingUser = null;
    } else {
        state.showNewStudentForm = false;
        state.addBookingUser = option;
    }
}

const bookingTypeOptions = [
    { label: "Regulier", value: "regular" },
    { label: "Classpass", value: "classpass" },
];

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

// ⚡ Bolt: Prevent array recreation to preserve reactivity, move expensive transforms to a metric map.
const futureLessons = computed(() => {
    const nowTime = Date.now();
    return lessons.value.filter((l: any) => new Date(l.date).getTime() > nowTime);
});

// ⚡ Bolt: Cache derived metrics to avoid O(N) array filtering in the template on every render
const lessonMetrics = computed(() => {
    const map = new Map();
    for (const lesson of lessons.value) {
        let regularCount = 0;
        let classpassCount = 0;
        let hasClasspass = false;

        const bookings = lesson.bookings || [];
        for (const b of bookings) {
            if (b.source === 'classpass') {
                classpassCount++;
                hasClasspass = true;
            } else {
                regularCount++;
            }
        }

        map.set(lesson.$id, {
            regularCount,
            classpassCount,
            hasClasspass,
            processedBookings: getLessonBookingsWithLabels(bookings)
        });
    }
    return map;
});

const computedLessons = computed(() => {
    return lessons.value.map((lesson) => {
        const metrics = lessonMetrics.value.get(lesson.$id);
        const regularCount = metrics ? metrics.regularCount : 0;
        const spots = 9 - regularCount;
        const isFull = regularCount >= 9;
        const spotsContext = spots === 1 ? "plek" : "plekken";
        const spotsText = isFull ? " (Vol)" : ` (Nog ${spots} ${spotsContext})`;

        // Classpass bookings ignore capacity, so full lessons stay selectable for them.
        const disabled = state.addBookingType === "regular" && isFull;

        return {
            label: $rav.formatDateInDutch(lesson.date) + spotsText,
            value: lesson,
            disabled,
        };
    });
});

const computedStudents = computed(() => {
    const base = students.value.map((student: any) => ({
        label: student.name,
        value: student,
        disabled: false,
    }));
    if (state.addBookingType === "classpass") {
        return [
            {
                label: NEW_STUDENT_SENTINEL.name,
                value: NEW_STUDENT_SENTINEL,
                disabled: false,
            },
            ...base,
        ];
    }
    return base;
});

const managedLesson = ref<any>(null);

const processedManagedBookings = computed(() =>
    managedLesson.value
        ? getLessonBookingsWithLabels(managedLesson.value.bookings || [])
        : [],
);

function openManage(lesson: any) {
    managedLesson.value = lesson;
}

function closeManage() {
    managedLesson.value = null;
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
                                    lessonMetrics.get(lesson.$id)?.regularCount || 0
                                }}/9<span
                                    v-if="lessonMetrics.get(lesson.$id)?.hasClasspass"
                                    class="text-sky-300"
                                >
                                    +
                                    {{
                                        lessonMetrics.get(lesson.$id)?.classpassCount || 0
                                    }}
                                    Classpass</span
                                >)</span
                            >
                            <div class="mt-1">
                                <span
                                    v-for="booking in (lessonMetrics.get(lesson.$id)?.processedBookings || [])"
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
                            class="block text-sm font-medium text-gray-300 mb-2"
                            >Type boeking</label
                        >
                        <div class="flex flex-col sm:flex-row gap-2">
                            <label
                                v-for="opt in bookingTypeOptions"
                                :key="opt.value"
                                class="flex-1 flex items-center gap-x-2 rounded-xl border px-4 py-2.5 cursor-pointer transition-colors"
                                :class="
                                    state.addBookingType === opt.value
                                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                                        : 'border-gray-800/60 bg-gray-900/40 text-gray-300 hover:border-gray-700'
                                "
                            >
                                <input
                                    type="radio"
                                    :value="opt.value"
                                    v-model="state.addBookingType"
                                    class="accent-emerald-500"
                                    @change="
                                        state.addBookingUser = null;
                                        state.showNewStudentForm = false;
                                    "
                                />
                                <span class="text-sm font-medium">{{
                                    opt.label
                                }}</span>
                            </label>
                        </div>
                        <p
                            v-if="state.addBookingType === 'classpass'"
                            class="text-xs text-gray-500 mt-2"
                        >
                            Classpass boekingen verbruiken geen credits en
                            tellen niet mee voor de maximale capaciteit.
                        </p>
                    </div>

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
                            v-if="!state.showNewStudentForm"
                            :model-value="state.addBookingUser"
                            icon="i-lucide-user"
                            size="lg"
                            color="primary"
                            variant="outline"
                            :items="computedStudents"
                            class="w-full"
                            value-key="value"
                            :search-input="{ placeholder: 'Zoek gebruiker...' }"
                            @update:model-value="onUserSelect"
                        />
                        <NewStudentForm
                            v-else
                            submit-label="Deelnemer aanmaken"
                            @created="onNewStudentCreated"
                            @cancel="state.showNewStudentForm = false"
                        />
                    </div>

                    <div
                        v-if="!state.showNewStudentForm"
                        class="flex gap-3 mt-2"
                    >
                        <UTooltip
                            :text="
                                !state.addBookingUser || !state.addBookingLesson
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
                                        !state.addBookingUser ||
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
