//imageLink.js

import React from 'react'

function imageLink(path) {
    const base = process.env.REACT_APP_API_URL || 'https://api.eventra.cloud'
    const imgUrl = process.env.REACT_APP_BACKEND_IMAGE_URL || `${base}/uploads/` || 'https://api.eventra.cloud/uploads';
    if (path?.startsWith("/uploads")) {
        return process.env.REACT_APP_API_URL + path;
    }else if(path?.startsWith("http")) {
        return path;
    }
    return imgUrl + path;
}

export default imageLink