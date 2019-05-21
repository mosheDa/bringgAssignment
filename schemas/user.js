const Joi = require('joi')

module.exports = Joi.object().keys({
  name: Joi.string().max(255).required(),
  address: Joi.string().max(255).required(),
  address_second_line: Joi.string().max(255).optional(),
  phone: Joi.string().regex(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/).required()
}).required()
