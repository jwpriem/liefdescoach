import { account, databases, ID } from "@/utils/appwrite.js";
import { Query } from 'appwrite';

export const state = () => ({
  loggedInUser: null,
  isAdmin: false,
  students: [],
  lessons: [],
  myBookings: [],
  errorMessage: null,
  isLoading: false
});

export const mutations = {
  SET_LOGGED_IN_USER(state, user) {
    state.loggedInUser = user;
  },
  SET_CREDITS_USER(state, credits) {
    state.loggedInUser.credits = credits;
  },
  SET_DEBITS_USER(state, debits) {
    state.loggedInUser.debits = debits;
    },
  SET_ADMIN(state, bool) {
    state.isAdmin = bool
  },
  SET_STUDENTS(state, students) {
    state.students = students
  },
  SET_LESSONS(state, lessons) {
    state.lessons = lessons
  },
  SET_MY_BOOKINGS(state, bookings) {
    state.myBookings = bookings
  },
  SET_ERROR_MESSAGE(state, message) {
    state.errorMessage = message
  },
  SET_LOADING(state, bool){
    state.isLoading = bool
  }
};

export const actions = {
  async loginUser({ commit, dispatch }, { email, password }) {
    try {
      await account.createEmailSession(email, password);
      await dispatch('getAccountDetails', { route: '/yoga/login' })
      commit('SET_ERROR_MESSAGE', null)
      
      // Navigate to account
      $nuxt.$router.push("/yoga/account");
    } catch (error) {
//      console.log(JSON.stringify(error, null, 4))
//      console.log(error['type'] == 'user_invalid_credentials')
      
      if(error['type'] == 'user_invalid_credentials') {
        //Navigate to login
        commit('SET_ERROR_MESSAGE', 'Verkeerde gebruikersnaam of wachtwoord')
      } else {
        //Navigate to login
        commit('SET_ERROR_MESSAGE', 'Er iets verkeerd gegaan')
      }
    }
  },
  async getAccountDetails({ commit, dispatch }, { route }){
    try {
      const user = await account.get();
      
      const res = await databases.getDocument(
        this.$config.database,
        'students',
        user.$id
        );
      commit('SET_LOGGED_IN_USER', user);
      commit('SET_CREDITS_USER', res.credits)
      commit('SET_DEBITS_USER', res.debits)
      commit('SET_ADMIN', user.labels.includes('admin'))
      
      // Only admin calls
      if(user.labels.includes('admin')) {
        dispatch('getStudents')
        dispatch('getLessons')
      }
      
      await dispatch('getMyBookings')
      
    } catch (error) {
      console.log('error')
      console.log(route)
      const str = JSON.stringify(error, null, 4); // (Optional) beautiful indented output.
      console.log(str); // Logs output to dev tools console.
      if(route){
        if(route == '/yoga/account') {
          $nuxt.$router.push('/yoga/login')
        }
      }
    }
  },
  async updateAccount({ commit, state }, { email, password, name, phone }) {
    try {
      if( email != state.loggedInUser.email ) {
        await account.updateEmail(email, password)  
      }
      
      if( name != state.loggedInUser.name ) {
        await account.updateName(name, password)
      }
      
      if( phone != state.loggedInUser.phone ) {
        await account.updatePhone(phone, password)
      }
      
      const user = await account.get();
      
      const data = {
        phone: user.phone,
        email: user.email,
        name: user.name
      }
      
      const res = await databases.updateDocument(
        this.$config.database,
        'students',
        user.$id,
        data
        );
      
      await dispatch('getAccountDetails', { route: '/yoga/account' })
      
    } catch(error) {
      
    }
  },
  async registerUser ({ commit }, { email, password, name, phone }) {
    try {
      await account.create(ID.unique(), email, password, name, phone);
      await account.createEmailSession(email, password);
      const user = await account.get();
      
      let data = {
        credits: 0,
        debits: 0,
        name: user.name,
        email: user.email,
        phone: user.phone,
        registration: user.registration
      }
      
      const res = await databases.createDocument(
        this.$config.database,
        'students',
        user.$id,
        data
        );
      commit('SET_LOGGED_IN_USER', user);
      commit('SET_CREDITS_USER', res.credits)
      commit('SET_DEBITS_USER', res.debits)
      
    } catch (error) {
      throw error;
    }
  },
  async getStudents({ commit,state }) {
    try {
      if(state.isAdmin){
        const list = await databases.listDocuments(
          this.$config.database,
          'students',
          )
        commit('SET_STUDENTS', list.documents)
      } else {
        commit('SET_STUDENTS', [])
      }
    }catch (error) {
      console.log(error)
    }
  },
  async getLessons({ commit,state }) {
    try {
          const list = await databases.listDocuments(
            this.$config.database,
            'lessons',
            state.loggedInUser ? [] : [ Query.select(['date', '$id', 'spots']) ]
            )
        
        commit('SET_LESSONS', list.documents)
      
    }catch (error) {
      console.log(error)
    }
  },
  async logoutUser({ commit }) {
    try {
      await account.deleteSession("current");
      commit('SET_LOGGED_IN_USER', null);
      commit('SET_ADMIN', false);
      commit('SET_STUDENTS', [])
      commit('SET_LESSONS', [])
      commit('SET_MY_BOOKINGS', [])

    } catch (error) {
      throw error;
    }
  },
  async addCredits({ commit, state, dispatch }, { credits, user }){
    try {
      const balance = credits - user.debits
      const data = {
        credits: user.credits + balance,
        debits: 0
      }
      
      await databases.updateDocument(
        this.$config.database,
        'students',
        user.$id,
        data
      )
      
      await dispatch('getStudents')
      await dispatch('getAccountDetails')
    }catch (error) {
      console.log(error)
    }
  },
  async getMyBookings({ commit, state, dispatch }) {
    try {
      const myBookings = await databases.listDocuments(
        this.$config.database,
        'bookings',
        [
          Query.equal("students", [state.loggedInUser.$id])
        ]
      )
      commit('SET_MY_BOOKINGS', myBookings.documents)
    } catch (error) {
      console.log(error)
    }
  },
  async handleBooking({ commit, state, dispatch }, { lesson, user }){
    try {
      commit('SET_LOADING', true)
      // Register booking
      await databases.createDocument(
        this.$config.database,
        'bookings',
        ID.unique(),
        { lessons: lesson.$id, students: user.$id }
      )
      
      // Update student credits/debits
      let data = {
        credits: user.credits,
        debits: user.debits
      }

      if(user.credits != 0) {
        data['credits'] = user.credits - 1
      } else {
        data['debits'] = user.debits + 1
      }
      
      await databases.updateDocument(
        this.$config.database,
        'students',
        user.$id,
        data
        )
      
      // Update availability lesson
      const newSpots = lesson.spots - 1
      
      await databases.updateDocument(
        this.$config.database,
        'lessons',
        lesson.$id,
        { spots: newSpots }
      )
      await dispatch('getStudents')
      await dispatch('getAccountDetails')
      await dispatch('getLessons')
      
      commit('SET_LOADING', false)
    }catch (error) {
      commit('SET_LOADING', false)
      console.log(error)
    }
  }
};


export const getters = {
  loggedInUser: state => state.loggedInUser,
  isAdmin: state => state.isAdmin,
  students: state => state.students,
  lessons: state => state.lessons,
  myBookings: state => state.myBookings,
  errorMessage: state => state.errorMessage,
  isLoading: state => state.isLoading
};