import multer from "multer"
import path from "path"
import fs from "fs"

const uploadDir = path.join( __dirname, "../../uploads")


if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true});
}

const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null, uploadDir);
    },
    filename:(req,file,cb)=>{
        const uniqueName = `${Date.now()}-${file.originalname}`
        cb(null,uniqueName);
    }
})

export const upload = multer({
    storage,
    limits:{fileSize :20*1024*1024},
    fileFilter:(req,file,cb)=>{
        if(file.mimetype !== "application/pdf"){
            return cb(new Error("Only PDF files are allowed"));
        }
        cb(null,true);
    }
})