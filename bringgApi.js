const Axios = require('axios')
const CryptoJS = require('crypto-js')
const Moment = require('moment')
const _ = require('lodash')

const { apiAdress, companyId, accessToken, secretKey } = require('./bringg.json')

const customersRoute = apiAdress + 'customers'
const ordersRoute = apiAdress + 'tasks'
const lastWeekStart = Moment().subtract(1, 'weeks').startOf('isoWeek')
const lastWeekEnd = Moment().subtract(1, 'weeks').endOf('isoWeek')

const createCustomerAndOrder = async (data) => {
  try {
    const res = await Axios.post(customersRoute, signRequest(data.user))
    const customerId = _.get(res, 'data.customer.id')
    if (!customerId) return new Error('faild to read customer data')
    await createOrder(data.order, customerId)
    return
  } catch (error) {
    return error
  }
}

const recreateOrders = async (phoneNumber) => {
  try {
    let res = await Axios.get(`${customersRoute}/phone/${phoneNumber}`, { data: signRequest({}) })
    const customerId = _.get(res, 'data.customer.id')
    if (!customerId) return new Error('faild to read customer data')
    handleUserOrders(customerId)
    return
  } catch (error) {
    return error
  }
}

const handleUserOrders = async (customerId) => {
  for (let page = 1; ; page++) {
    try {
      const res = await Axios.get(ordersRoute, { data: signRequest({ page }) })
      const orders = res.data
      if (!orders) throw new Error('cannot read orders data')

      // finish when there is no more pages
      if (res.data.length === 0) return

      orders.filter((order) => {
        return (order.customer.id === customerId) && isDateAtLastWeek(order.created_at)
      }).forEach(async order => {
        await createOrder({ title: order.title }, customerId)
      })
    } catch (error) {
      console.error(error)
    }
  }
}

const isDateAtLastWeek = (date) => {
  date = Moment(date)
  return date.isBefore(lastWeekEnd) && date.isAfter(lastWeekStart)
}
const createOrder = async (order, customer_id) => {
  await Axios.post(ordersRoute, signRequest({ ...order, customer_id }))
}

const signRequest = (params) => {
  params['company_id'] = companyId
  params['timestamp'] = Date.now()
  params['access_token'] = accessToken

  var queryParams = ''

  for (let key in params) {
    let value = params[key]
    if (queryParams.length > 0) {
      queryParams += '&'
    }
    queryParams += key + '=' + encodeURIComponent(value)
  }

  params['signature'] = CryptoJS.HmacSHA1(queryParams, secretKey).toString()
  return params
}

module.exports = {
  createCustomerAndOrder,
  recreateOrders
}
