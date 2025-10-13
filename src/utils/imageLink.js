//imageLink.js

import React from 'react'

function imageLink(path) {
    const imgUrl = process.env.APP_BACKEND_IMAGE_URL || "http://localhost:3500/uploads/";
    if (path?.startsWith("/uploads")) {
        return "http://localhost:3500" + path;
    }else if(path?.startsWith("http")) {
        return path;
    }
    return imgUrl + path;
}

export default imageLink