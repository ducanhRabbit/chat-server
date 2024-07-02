const User = require("../models/User")
const filterObj = require("../utils/filterObj")

class UserController {
   async updateMe(res,req,next){
    const {user} = req

    const filterObject = filterObj(req.body,'firstName','lastName', 'about', 'avatar')

    const updateUser = await User.findByIdAndUpdate(user._id,filterObject,{
        new:true,
        validateModifiedOnly:true
    })

    res.status(200).json({
        status: "success",
        data: userDoc,
        message: "User Updated successfully",
      });
   } 
}

module.exports = new UserController()