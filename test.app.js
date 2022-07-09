import Joi from "joi";
function validate(user) {
  var schema = {
    email: Joi.string().min(3).required().email(),
  };
  return Joi.validate(user, schema);
}

validate()