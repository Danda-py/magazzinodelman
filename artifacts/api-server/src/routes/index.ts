import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import proposalsRouter from "./proposals";
import chatRouter from "./chat";
import checkoutRouter from "./checkout";
import financialRouter from "./financial";
import cmsRouter from "./cms";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(proposalsRouter);
router.use(chatRouter);
router.use(checkoutRouter);
router.use(financialRouter);
router.use(cmsRouter);
router.use(usersRouter);

export default router;
