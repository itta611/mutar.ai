import { Hono } from "hono"

import { projectRoutes } from "./projects/[projectId]"
import { projectImageRoutes } from "./projects/[projectId]/image"
import { projectStarRoutes } from "./projects/[projectId]/star"
import { projectThumbnailRoutes } from "./projects/[projectId]/thumbnail"
import { projectsRoutes } from "./projects"

const routes = new Hono()
  .route("/projects", projectsRoutes)
  .route("/projects/:projectId", projectRoutes)
  .route("/projects/:projectId/image", projectImageRoutes)
  .route("/projects/:projectId/star", projectStarRoutes)
  .route("/projects/:projectId/thumbnail", projectThumbnailRoutes)

export type AppType = typeof routes

export const app = new Hono().basePath("/api").route("/", routes)
