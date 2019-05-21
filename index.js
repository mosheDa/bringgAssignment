const Boom = require('boom')
const Hapi = require('hapi')
const Joi = require('joi')
const _ = require('lodash')

const { createCustomerAndOrder, recreateOrders } = require('./bringgApi')

const OrderSchema = require('./schemas/order')
const UserSchema = require('./schemas/user')

const newOrderSchema = Joi.object().keys({
  user: UserSchema,
  order: OrderSchema
})

const init = async () => {
  const server = Hapi.server({
    port: 8080,
    host: 'localhost',
    routes: {
      validate: {
        failAction: async (request, h, err) => {
          if (process.env.NODE_ENV === 'production') {
          // In prod, log a limited error message and throw the default Bad Request error.
            console.error('ValidationError:', err.message)
            throw Boom.badRequest(`Invalid request payload input`)
          } else {
          // During development, log and respond with the full error.
            console.error(err)
            throw err
          }
        }
      }
    }
  })

  server.route({
    method: 'post',
    path: '/orders',
    handler: async (request, h) => {
      const err = await createCustomerAndOrder(request.payload)
      if (err) {
        const statusCode = _.get(err, 'response.status') ? _.get(err, 'response.status') : 500
        return new Boom(err, { statusCode })
      }
      return 'success'
    },
    options: {
      validate: {
        payload: newOrderSchema
      }
    }
  })

  server.route({
    method: 'put',
    path: '/orders/recreate',
    handler: async (request, h) => {
      if (!request.headers.phone) return Boom.badRequest('please send phone number')

      const err = await recreateOrders(request.headers.phone)
      if (err) {
        const statusCode = _.get(err, 'response.status') ? _.get(err, 'response.status') : 500
        return new Boom(err, { statusCode })
      }
      return 'working on it...'
    }
  })

  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

init()
