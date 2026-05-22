import express from "express"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envCandidates = [
    path.join(__dirname, "..", ".env"),
    path.join(__dirname, ".env")
]
for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath })
        break
    }
}
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"


const app=express()
app.set("trust proxy", 1)
const normalizeOrigin=(origin)=>origin?.trim().replace(/\/$/, "") || ""
const allowedOrigins=(process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map(origin => normalizeOrigin(origin))
    .filter(Boolean)
if(process.env.FRONTEND_URL){
    allowedOrigins.push(normalizeOrigin(process.env.FRONTEND_URL))
}
if(process.env.VERCEL_URL){
    allowedOrigins.push(normalizeOrigin(`https://${process.env.VERCEL_URL}`))
}
const isAllowedOrigin=(origin)=>{
    const normalizedOrigin=normalizeOrigin(origin)
    if(!normalizedOrigin) return true
    if(allowedOrigins.includes(normalizedOrigin)) return true
    if(/^http:\/\/localhost:\d+$/.test(normalizedOrigin)) return true
    if(/^https:\/\/.+\.vercel\.app$/.test(normalizedOrigin)) return true
    return false
}
app.use((req,res,next)=>{
    const origin=normalizeOrigin(req.headers.origin)
    if(origin && isAllowedOrigin(origin)){
        res.header("Access-Control-Allow-Origin", origin)
        res.header("Access-Control-Allow-Credentials", "true")
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        const requestHeaders=req.headers["access-control-request-headers"]
        res.header("Access-Control-Allow-Headers", typeof requestHeaders === "string" && requestHeaders.length > 0 ? requestHeaders : "Content-Type, Authorization")
        res.header("Vary", "Origin")
    }
    if(req.method === "OPTIONS"){
        return isAllowedOrigin(origin) ? res.sendStatus(204) : res.sendStatus(403)
    }
    next()
})
const port=process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)


app.listen(port,()=>{
    connectDb()
    console.log("server started")
})

