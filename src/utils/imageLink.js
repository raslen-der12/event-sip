//imageLink.js

import React from 'react'

function imageLink(path) {
    const base = process.env.APP_API_URL
    const imgUrl = process.env.APP_BACKEND_IMAGE_URL || `${base}/uploads/`;
    if (path?.startsWith("/uploads")) {
        return process.env.APP_API_URL + path;
    }else if(path?.startsWith("http")) {
        return path;
    }
    return imgUrl + path;
}

export default imageLink