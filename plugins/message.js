import Vue from 'vue'
import Message from '~/components/Message'

Message.install = (Vue, options) => {
  Vue.prototype.$message = new (Vue.extend(Message))({ propsData: options })
  Vue.$message = Vue.prototype.$message
  if (typeof window !== 'undefined') {
    window.$message = Vue.prototype.$message
  }
}

export default Message

Vue.use(Message)
