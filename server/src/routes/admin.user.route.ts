import express from "express";
import { userController } from '../controllers/admin.user.controller'
import { validateAdd, isRequestValidated, validateEdit, validateId } from '../validations/admin.user.validations'
const userRouter = express.Router()
import authentication from "../middleware/auth.middleware"
userRouter.post('/', authentication, validateAdd, isRequestValidated, userController.addUser)
userRouter.get('/', authentication, userController.getUsers)
userRouter.put('/:id', authentication, validateId, validateEdit, isRequestValidated, userController.updateUser)
userRouter.delete('/:id', authentication, validateId, userController.deleteUser)
userRouter.get('/:id', authentication, validateId, userController.getUser)

export default userRouter;