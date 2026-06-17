import { Hono } from "hono"

import { accountRoutes } from "./account"
import { creditsRoutes } from "./credits"
import { projectRoutes } from "./projects/[projectId]"
import { projectImageRoutes } from "./projects/[projectId]/image"
import { projectStarRoutes } from "./projects/[projectId]/star"
import { projectsRoutes } from "./projects"

const routes = new Hono()
  .route("/account", accountRoutes)
  .route("/credits", creditsRoutes)
  .route("/projects", projectsRoutes)
  .route("/projects/:projectId", projectRoutes)
  .route("/projects/:projectId/image", projectImageRoutes)
  .route("/projects/:projectId/star", projectStarRoutes)

export type AppType = typeof routes

export const app = new Hono().basePath("/api").route("/", routes)
