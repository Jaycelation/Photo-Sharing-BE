const isAuthenticated = (req, res, next) => {
    const whiteList = ['/admin/login', '/admin/logout', '/user'] 

    if (whiteList.includes(req.path) || 
        (req.method === 'POST' && req.path === '/user') || 
        req.session.user_id) {
        return next()
    }
    
    return res.status(401).send("Unauthorized")
}

module.exports = isAuthenticated