//imageLink.js

import React from 'react'

function imageLink(path) {
    const imgUrl = process.env.APP_BACKEND_IMAGE_URL || "https://api.eventra.cloud/uploads/";
    if (path?.startsWith("/uploads")) {
        return "https://api.eventra.cloud" + path;
    }else if(path?.startsWith("http")) {
        return path;
    }
    return imgUrl + path;
}

export default imageLink