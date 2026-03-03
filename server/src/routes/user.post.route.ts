import express from "express";
import { postController } from '../controllers/user.post.controller'
import { validateAdd, isRequestValidated, validateEdit, validateId } from '../validations/user.post.validations'
const postRouter = express.Router()
import authentication from "../middleware/auth.middleware"
postRouter.post('/', authentication, validateAdd, isRequestValidated, postController.addPost)
postRouter.get('/', authentication, postController.getPosts)
postRouter.put('/:id', authentication, validateId, validateEdit, isRequestValidated, postController.updatePost)
postRouter.delete('/:id', authentication, validateId, postController.deletePost)
postRouter.post('/test', postController.testPost)
postRouter.get('/serverPagination', authentication, postController.getPostsWithPagination)
postRouter.get('/:id', authentication, validateId, postController.getPost)

export default postRouter;