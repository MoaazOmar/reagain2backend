exports.preventAccessLogin   = (req,res,next)=>{
 if(!req.session.user) next()
 else res.redirect('/')
}

exports.isLoggedIn = (req , res , next)=>{
    if(req.session.user) next()
    res.status(401).json({ message: 'Unauthorized. Please log in.' });

}